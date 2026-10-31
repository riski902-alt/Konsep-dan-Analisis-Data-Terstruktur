import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALL_AUTHORITATIVE_QUESTIONS,
  pickMakassarCheer,
  sanitizeQuestion,
  validateAnswerAuthoritative,
} from './src/server/questionsBank.ts';
import type { AuthoritativeQuestion } from './src/server/questionsBank.ts';
import type {
  LeaderboardEntry,
  RaceSessionState,
  TeamAnswerFeedback,
  TeamId,
  WinnerResult,
} from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface InternalSession {
  state: RaceSessionState;
  questions: AuthoritativeQuestion[];
  cheerCounter: number;
}

const sessions = new Map<string, InternalSession>();
const leaderboard: LeaderboardEntry[] = [];

function createSessionId(): string {
  return `race_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const TOPIC_LABELS: Record<number, string> = {
  0: 'Semua Materi Lengkap (100 Soal Sesuai Urutan File)',
  1: 'Topik 1: Konsep Dasar Data: Data Terstruktur vs. Tidak Terstruktur (20 Soal)',
  2: 'Topik 2: Pengidentifikasian dan Pemodelan Data Terstruktur (20 Soal)',
  3: 'Topik 3: Antarmuka dan Elemen Dasar Lembar Kerja Pengolah Data (20 Soal)',
  4: 'Topik 4: Pengolahan dan Pengorganisasian Data (20 Soal)',
  5: 'Topik 5: Praktik Analisis dan Pengolahan Data Sederhana (20 Soal)',
};

function evaluateIndependentFinish(session: InternalSession, forceConclude: boolean): void {
  const st = session.state;
  if (st.status === 'finished') return;

  const lReachedFinish = st.lamacca.steps >= st.totalSteps;
  const tReachedFinish = st.toacca.steps >= st.totalSteps;

  // 1. Direct Finish Line Victory (First motor to reach totalSteps wins!)
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

    finalizeSession(session, winner, winReason);
    return;
  }

  // 2. If one team already completed all questions with < totalSteps, and the other team overtakes their final step count!
  if (st.lamacca.completedAllQuestions && st.toacca.steps > st.lamacca.steps) {
    finalizeSession(
      session,
      'toacca',
      `Melampaui total langkah akhir Tim LAMACCA (${st.toacca.steps} vs ${st.lamacca.steps} langkah)!`,
    );
    return;
  }
  if (st.toacca.completedAllQuestions && st.lamacca.steps > st.toacca.steps) {
    finalizeSession(
      session,
      'lamacca',
      `Melampaui total langkah akhir Tim TOACCA (${st.lamacca.steps} vs ${st.toacca.steps} langkah)!`,
    );
    return;
  }

  // 3. If one team completed all questions and the trailing team has fewer remaining questions than the gap (mathematically impossible to tie)
  const lRemaining = st.lamacca.completedAllQuestions
    ? 0
    : st.totalQuestions - st.lamacca.currentIndex;
  const tRemaining = st.toacca.completedAllQuestions
    ? 0
    : st.totalQuestions - st.toacca.currentIndex;

  if (st.lamacca.completedAllQuestions && st.toacca.steps + tRemaining < st.lamacca.steps && st.toacca.completedAllQuestions) {
    finalizeSession(
      session,
      'lamacca',
      `Unggul posisi terjauh (${st.lamacca.steps} langkah) setelah seluruh soal selesai!`,
    );
    return;
  }

  // 4. Both teams finished all questions in the sequence (or teacher forced conclude)
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
      // Equal steps: compare who reached that score / finished all questions earlier
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

    finalizeSession(session, winner, winReason);
  }
}

function finalizeSession(
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

  leaderboard.unshift({
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

  if (leaderboard.length > 25) {
    leaderboard.length = 25;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/topics', (_req, res) => {
    res.json({
      totalQuestionsInFile: ALL_AUTHORITATIVE_QUESTIONS.length,
      topics: [
        { topicFilter: 0, label: TOPIC_LABELS[0], count: 100 },
        { topicFilter: 1, label: TOPIC_LABELS[1], count: 20 },
        { topicFilter: 2, label: TOPIC_LABELS[2], count: 20 },
        { topicFilter: 3, label: TOPIC_LABELS[3], count: 20 },
        { topicFilter: 4, label: TOPIC_LABELS[4], count: 20 },
        { topicFilter: 5, label: TOPIC_LABELS[5], count: 20 },
      ],
    });
  });

  app.post('/api/race/start', (req, res) => {
    const rawTopicFilter = Number(req.body?.topicFilter ?? 0);
    const topicFilter = [0, 1, 2, 3, 4, 5].includes(rawTopicFilter) ? rawTopicFilter : 0;

    const lamaccaPlayer =
      String(req.body?.lamaccaPlayer ?? '').trim().slice(0, 32) || 'Pembalap LAMACCA';
    const toaccaPlayer =
      String(req.body?.toaccaPlayer ?? '').trim().slice(0, 32) || 'Pembalap TOACCA';

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

    sessions.set(sessionId, {
      state,
      questions: selectedQuestions,
      cheerCounter: 0,
    });

    res.json({
      session: state,
      questions: selectedQuestions.map(sanitizeQuestion),
    });
  });

  app.post('/api/race/mark-go', (req, res) => {
    const sessionId = String(req.body?.sessionId ?? '');
    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Sesi balapan tidak ditemukan.' });
      return;
    }
    const now = Date.now();
    session.state.raceStartedAtMs = now;
    session.state.lamacca.questionOpenedAtMs = now;
    session.state.toacca.questionOpenedAtMs = now;
    res.json({ session: session.state });
  });

  app.post('/api/race/answer', (req, res) => {
    const sessionId = String(req.body?.sessionId ?? '');
    const team = String(req.body?.team ?? '') as TeamId;
    const questionId = String(req.body?.questionId ?? '');
    const answer = req.body?.answer;

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Sesi balapan tidak ditemukan.' });
      return;
    }

    if (team !== 'lamacca' && team !== 'toacca') {
      res.status(400).json({ error: 'Identitas tim tidak valid.' });
      return;
    }

    const st = session.state;
    const teamState = team === 'lamacca' ? st.lamacca : st.toacca;

    if (st.status === 'finished' || teamState.completedAllQuestions) {
      res.json({
        session: st,
        teamResult: teamState.lastFeedback ?? {
          questionId,
          questionNumber: teamState.currentIndex + 1,
          isCorrect: false,
          submittedValue: '-',
          message: 'Seluruh soal tim ta\' telah selesai!',
          validatedAtMs: Date.now(),
          elapsedFromQuestionOpenMs: 0,
        },
      });
      return;
    }

    const activeQuestion = session.questions[teamState.currentIndex];
    if (!activeQuestion || activeQuestion.id !== questionId) {
      // Idempotent guard if double-triggered on previous questionId
      res.json({
        session: st,
        teamResult: teamState.lastFeedback ?? {
          questionId,
          questionNumber: teamState.currentIndex + 1,
          isCorrect: false,
          submittedValue: '-',
          message: 'Soal sudah berganti.',
          validatedAtMs: Date.now(),
          elapsedFromQuestionOpenMs: 0,
        },
      });
      return;
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

    // Advance ONLY THIS TEAM'S question index immediately without waiting for opponent!
    if (teamState.currentIndex >= st.totalQuestions - 1) {
      teamState.completedAllQuestions = true;
      teamState.completedQuestionsAtMs = validatedAtMs;
    } else {
      teamState.currentIndex += 1;
      teamState.questionOpenedAtMs = validatedAtMs;
    }

    evaluateIndependentFinish(session, false);

    res.json({
      session: st,
      teamResult: feedback,
    });
  });

  app.post('/api/race/conclude', (req, res) => {
    const sessionId = String(req.body?.sessionId ?? '');
    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Sesi balapan tidak ditemukan.' });
      return;
    }
    evaluateIndependentFinish(session, true);
    res.json({ session: session.state });
  });

  app.get('/api/race/leaderboard', (_req, res) => {
    res.json({ leaderboard });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LAMACCA VS TOACCA Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
