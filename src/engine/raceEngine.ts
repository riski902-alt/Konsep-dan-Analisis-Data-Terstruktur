import {
  ALL_AUTHORITATIVE_QUESTIONS,
  pickMakassarCheer,
  sanitizeQuestion,
  validateAnswerAuthoritative,
} from '../server/questionsBank.ts';
import type { AuthoritativeQuestion } from '../server/questionsBank.ts';
import type {
  LeaderboardEntry,
  PublicQuestion,
  RaceSessionState,
  StartRaceResponse,
  SubmitAnswerResponse,
  TeamAnswerFeedback,
  TeamId,
  WinnerResult,
} from '../types/game.ts';

export interface TopicOptionItem {
  topicFilter: number;
  label: string;
  count: number;
}

interface InternalSession {
  state: RaceSessionState;
  questions: AuthoritativeQuestion[];
  cheerCounter: number;
}

export const TOPIC_LABELS: Record<number, string> = {
  0: 'Semua Materi Lengkap (100 Soal Sesuai Urutan File)',
  1: 'Topik 1: Konsep Dasar Data: Data Terstruktur vs. Tidak Terstruktur (20 Soal)',
  2: 'Topik 2: Pengidentifikasian dan Pemodelan Data Terstruktur (20 Soal)',
  3: 'Topik 3: Antarmuka dan Elemen Dasar Lembar Kerja Pengolah Data (20 Soal)',
  4: 'Topik 4: Pengolahan dan Pengorganisasian Data (20 Soal)',
  5: 'Topik 5: Praktik Analisis dan Pengolahan Data Sederhana (20 Soal)',
};

function cloneState<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function createSessionId(): string {
  return `race_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class RaceEngine {
  private sessions = new Map<string, InternalSession>();
  private leaderboard: LeaderboardEntry[] = [];
  private onLeaderboardChange?: (entries: LeaderboardEntry[]) => void;

  constructor(
    initialLeaderboard: LeaderboardEntry[] = [],
    onLeaderboardChange?: (entries: LeaderboardEntry[]) => void,
  ) {
    this.leaderboard = [...initialLeaderboard];
    this.onLeaderboardChange = onLeaderboardChange;
  }

  public getTopicsInfo(): { totalQuestionsInFile: number; topics: TopicOptionItem[] } {
    return {
      totalQuestionsInFile: ALL_AUTHORITATIVE_QUESTIONS.length,
      topics: [
        { topicFilter: 0, label: TOPIC_LABELS[0], count: 100 },
        { topicFilter: 1, label: TOPIC_LABELS[1], count: 20 },
        { topicFilter: 2, label: TOPIC_LABELS[2], count: 20 },
        { topicFilter: 3, label: TOPIC_LABELS[3], count: 20 },
        { topicFilter: 4, label: TOPIC_LABELS[4], count: 20 },
        { topicFilter: 5, label: TOPIC_LABELS[5], count: 20 },
      ],
    };
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return cloneState(this.leaderboard);
  }

  public startRace(
    rawTopicFilter: number,
    rawLamaccaPlayer: string,
    rawToaccaPlayer: string,
  ): StartRaceResponse {
    const topicFilter = [0, 1, 2, 3, 4, 5].includes(rawTopicFilter) ? rawTopicFilter : 0;
    const lamaccaPlayer =
      String(rawLamaccaPlayer ?? '').trim().slice(0, 32) || 'Pembalap LAMACCA';
    const toaccaPlayer =
      String(rawToaccaPlayer ?? '').trim().slice(0, 32) || 'Pembalap TOACCA';

    // Strictly preserve original file sequence — NO shuffling, NO skipping!
    const selectedQuestions =
      topicFilter === 0
        ? ALL_AUTHORITATIVE_QUESTIONS
        : ALL_AUTHORITATIVE_QUESTIONS.filter((q) => q.topicIndex === topicFilter);

    const now = Date.now();
    const sessionId = createSessionId();
    const totalQuestions = selectedQuestions.length;

    const state: RaceSessionState = {
      sessionId,
      topicFilter,
      modeLabel: TOPIC_LABELS[topicFilter] || TOPIC_LABELS[0],
      status: 'racing',
      totalQuestions,
      totalSteps: totalQuestions,
      raceStartedAtMs: now,
      raceFinishedAtMs: null,
      winner: null,
      winReason: null,
      lamacca: {
        id: 'lamacca',
        teamName: 'TIM LAMACCA',
        playerName: lamaccaPlayer,
        currentIndex: 0,
        questionOpenedAtMs: now,
        completedAllQuestions: false,
        steps: 0,
        correctCount: 0,
        wrongCount: 0,
        lastFeedback: null,
        finishedAtMs: null,
        completedQuestionsAtMs: null,
        cumulativeCorrectTimeMs: 0,
      },
      toacca: {
        id: 'toacca',
        teamName: 'TIM TOACCA',
        playerName: toaccaPlayer,
        currentIndex: 0,
        questionOpenedAtMs: now,
        completedAllQuestions: false,
        steps: 0,
        correctCount: 0,
        wrongCount: 0,
        lastFeedback: null,
        finishedAtMs: null,
        completedQuestionsAtMs: null,
        cumulativeCorrectTimeMs: 0,
      },
    };

    this.sessions.set(sessionId, {
      state,
      questions: selectedQuestions,
      cheerCounter: 0,
    });

    const publicQuestions: PublicQuestion[] = selectedQuestions.map(sanitizeQuestion);

    return {
      session: cloneState(state),
      questions: cloneState(publicQuestions),
    };
  }

  public markGo(sessionId: string): RaceSessionState | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    const now = Date.now();
    session.state.raceStartedAtMs = now;
    session.state.lamacca.questionOpenedAtMs = now;
    session.state.toacca.questionOpenedAtMs = now;
    return cloneState(session.state);
  }

  public submitAnswer(
    sessionId: string,
    team: TeamId,
    questionId: string,
    answer: unknown,
  ): SubmitAnswerResponse | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const st = session.state;
    const teamState = team === 'lamacca' ? st.lamacca : st.toacca;

    if (st.status === 'finished' || teamState.completedAllQuestions) {
      return {
        session: cloneState(st),
        teamResult: cloneState(
          teamState.lastFeedback ?? {
            questionId,
            questionNumber: teamState.currentIndex + 1,
            isCorrect: false,
            submittedValue: '-',
            message: "Seluruh soal tim ta' telah selesai!",
            validatedAtMs: Date.now(),
            elapsedFromQuestionOpenMs: 0,
          },
        ),
      };
    }

    const activeQuestion = session.questions[teamState.currentIndex];
    if (!activeQuestion || activeQuestion.id !== questionId) {
      return {
        session: cloneState(st),
        teamResult: cloneState(
          teamState.lastFeedback ?? {
            questionId,
            questionNumber: teamState.currentIndex + 1,
            isCorrect: false,
            submittedValue: '-',
            message: 'Soal sudah berganti.',
            validatedAtMs: Date.now(),
            elapsedFromQuestionOpenMs: 0,
          },
        ),
      };
    }

    const validatedAtMs = Date.now();
    const elapsedFromQuestionOpenMs = Math.max(
      1,
      validatedAtMs - teamState.questionOpenedAtMs,
    );

    const { isCorrect, normalizedDisplay } = validateAnswerAuthoritative(
      activeQuestion,
      answer,
    );

    session.cheerCounter += 1;
    const message = pickMakassarCheer(
      team,
      isCorrect,
      session.cheerCounter + teamState.currentIndex,
    );

    const feedback: TeamAnswerFeedback = {
      questionId: activeQuestion.id,
      questionNumber: teamState.currentIndex + 1,
      isCorrect,
      submittedValue: normalizedDisplay,
      message,
      validatedAtMs,
      elapsedFromQuestionOpenMs,
    };

    teamState.lastFeedback = feedback;

    if (isCorrect) {
      teamState.steps = Math.min(st.totalSteps, teamState.steps + 1);
      teamState.correctCount += 1;
      teamState.cumulativeCorrectTimeMs += elapsedFromQuestionOpenMs;
      if (teamState.steps >= st.totalSteps && teamState.finishedAtMs === null) {
        teamState.finishedAtMs = validatedAtMs;
      }
    } else {
      teamState.wrongCount += 1;
    }

    if (teamState.currentIndex >= st.totalQuestions - 1) {
      teamState.completedAllQuestions = true;
      teamState.completedQuestionsAtMs = validatedAtMs;
    } else {
      teamState.currentIndex += 1;
      teamState.questionOpenedAtMs = validatedAtMs;
    }

    this.evaluateIndependentFinish(session, false);

    return {
      session: cloneState(st),
      teamResult: cloneState(feedback),
    };
  }

  public concludeRace(sessionId: string): RaceSessionState | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    this.evaluateIndependentFinish(session, true);
    return cloneState(session.state);
  }

  private evaluateIndependentFinish(session: InternalSession, forceConclude: boolean): void {
    const st = session.state;
    if (st.status === 'finished') return;

    const lReachedFinish = st.lamacca.steps >= st.totalSteps;
    const tReachedFinish = st.toacca.steps >= st.totalSteps;

    // 1. Direct Finish Line Victory
    if (lReachedFinish || tReachedFinish) {
      let winner: WinnerResult = null;
      let winReason = '';

      if (lReachedFinish && tReachedFinish) {
        const lTime = st.lamacca.finishedAtMs ?? Number.MAX_SAFE_INTEGER;
        const tTime = st.toacca.finishedAtMs ?? Number.MAX_SAFE_INTEGER;
        if (lTime < tTime) {
          winner = 'lamacca';
          winReason = 'Mencapai garis finis terlebih dahulu berdasarkan waktu validasi sistem!';
        } else if (tTime < lTime) {
          winner = 'toacca';
          winReason = 'Mencapai garis finis terlebih dahulu berdasarkan waktu validasi sistem!';
        } else {
          winner = 'draw';
          winReason = 'Kedua motor menyentuh garis finis pada milidetik yang tepat sama!';
        }
      } else if (lReachedFinish) {
        winner = 'lamacca';
        winReason = 'Mencapai garis finis terlebih dahulu!';
      } else {
        winner = 'toacca';
        winReason = 'Mencapai garis finis terlebih dahulu!';
      }

      this.finalizeSession(session, winner, winReason);
      return;
    }

    // 2. Overtaking an opponent who already completed all questions
    if (st.lamacca.completedAllQuestions && st.toacca.steps > st.lamacca.steps) {
      this.finalizeSession(
        session,
        'toacca',
        `Melampaui total langkah akhir Tim LAMACCA (${st.toacca.steps} vs ${st.lamacca.steps} langkah)!`,
      );
      return;
    }
    if (st.toacca.completedAllQuestions && st.lamacca.steps > st.toacca.steps) {
      this.finalizeSession(
        session,
        'lamacca',
        `Melampaui total langkah akhir Tim TOACCA (${st.lamacca.steps} vs ${st.toacca.steps} langkah)!`,
      );
      return;
    }

    // 3. Both teams finished all questions in sequence (or forced conclude)
    if ((st.lamacca.completedAllQuestions && st.toacca.completedAllQuestions) || forceConclude) {
      let winner: WinnerResult = null;
      let winReason = '';

      if (st.lamacca.steps > st.toacca.steps) {
        winner = 'lamacca';
        winReason = `Unggul posisi terjauh (${st.lamacca.steps} vs ${st.toacca.steps} langkah) setelah seluruh soal selesai!`;
      } else if (st.toacca.steps > st.lamacca.steps) {
        winner = 'toacca';
        winReason = `Unggul posisi terjauh (${st.toacca.steps} vs ${st.lamacca.steps} langkah) setelah seluruh soal selesai!`;
      } else {
        const lComp = st.lamacca.completedQuestionsAtMs ?? Number.MAX_SAFE_INTEGER;
        const tComp = st.toacca.completedQuestionsAtMs ?? Number.MAX_SAFE_INTEGER;
        if (st.lamacca.steps === 0 && st.toacca.steps === 0) {
          winner = 'draw';
          winReason = 'Hasil seri! Kedua tim memiliki langkah yang sama.';
        } else if (lComp < tComp) {
          winner = 'lamacca';
          winReason = `Langkah imbang (${st.lamacca.steps}) — Tim LAMACCA menyelesaikan seluruh soal lebih cepat!`;
        } else if (tComp < lComp) {
          winner = 'toacca';
          winReason = `Langkah imbang (${st.toacca.steps}) — Tim TOACCA menyelesaikan seluruh soal lebih cepat!`;
        } else if (st.lamacca.cumulativeCorrectTimeMs < st.toacca.cumulativeCorrectTimeMs) {
          winner = 'lamacca';
          winReason = 'Langkah imbang — unggul total kecepatan validasi jawaban benar!';
        } else if (st.toacca.cumulativeCorrectTimeMs < st.lamacca.cumulativeCorrectTimeMs) {
          winner = 'toacca';
          winReason = 'Langkah imbang — unggul total kecepatan validasi jawaban benar!';
        } else {
          winner = 'draw';
          winReason = 'Hasil seri! Kedua tim memperoleh langkah dan waktu validasi yang sama!';
        }
      }

      this.finalizeSession(session, winner, winReason);
    }
  }

  private finalizeSession(
    session: InternalSession,
    winner: WinnerResult,
    winReason: string,
  ): void {
    const st = session.state;
    st.status = 'finished';
    st.raceFinishedAtMs = Date.now();
    st.winner = winner;
    st.winReason = winReason;

    const durationSeconds = Math.max(
      1,
      Math.round((st.raceFinishedAtMs - st.raceStartedAtMs) / 1000),
    );

    this.leaderboard.unshift({
      id: st.sessionId,
      finishedAtIso: new Date(st.raceFinishedAtMs).toISOString(),
      modeLabel: st.modeLabel,
      winner,
      lamaccaPlayer: st.lamacca.playerName,
      toaccaPlayer: st.toacca.playerName,
      lamaccaSteps: st.lamacca.steps,
      toaccaSteps: st.toacca.steps,
      totalSteps: st.totalSteps,
      durationSeconds,
    });

    if (this.leaderboard.length > 25) {
      this.leaderboard.length = 25;
    }

    this.onLeaderboardChange?.(cloneState(this.leaderboard));
  }
}
