import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { CountdownOverlay } from './components/CountdownOverlay';
import { PreparationScreen } from './components/PreparationScreen';
import { QuestionControlDock } from './components/QuestionControlDock';
import { TopRaceHud } from './components/TopRaceHud';
import { VictoryScreen } from './components/VictoryScreen';
import { RaceArenaCanvas, type BikeFXEvent } from './game3d/RaceArenaCanvas';
import type {
  AudioSettings,
  CameraMode,
  LeaderboardEntry,
  PublicQuestion,
  RaceSessionState,
  RaceStatus,
  StartRaceResponse,
  SubmitAnswerResponse,
  TeamId,
} from './types/game';

interface TopicOption {
  topicFilter: number;
  label: string;
  count: number;
}

const DEFAULT_TOPICS: TopicOption[] = [
  {
    topicFilter: 0,
    label: 'Semua Materi Lengkap (100 Soal Sesuai Urutan File)',
    count: 100,
  },
  {
    topicFilter: 1,
    label: 'Topik 1: Konsep Dasar Data: Data Terstruktur vs. Tidak Terstruktur (20 Soal)',
    count: 20,
  },
  {
    topicFilter: 2,
    label: 'Topik 2: Pengidentifikasian dan Pemodelan Data Terstruktur (20 Soal)',
    count: 20,
  },
  {
    topicFilter: 3,
    label: 'Topik 3: Antarmuka dan Elemen Dasar Lembar Kerja Pengolah Data (20 Soal)',
    count: 20,
  },
  {
    topicFilter: 4,
    label: 'Topik 4: Pengolahan dan Pengorganisasian Data (20 Soal)',
    count: 20,
  },
  {
    topicFilter: 5,
    label: 'Topik 5: Praktik Analisis dan Pengolahan Data Sederhana (20 Soal)',
    count: 20,
  },
];

function detectInformatikaFunPlayers(): { lamacca: string; toacca: string } {
  if (typeof window === 'undefined') {
    return { lamacca: 'Pembalap LAMACCA', toacca: 'Pembalap TOACCA' };
  }

  const params = new URLSearchParams(window.location.search);
  const urlLamacca = params.get('lamacca') || params.get('player1') || params.get('user');
  const urlToacca = params.get('toacca') || params.get('player2');

  const globalUser = (
    window as unknown as {
      INFORMATIKA_FUN_USER?: { name?: string; displayName?: string; username?: string };
    }
  ).INFORMATIKA_FUN_USER;

  let storedName = '';
  try {
    const raw =
      localStorage.getItem('informatika_fun_user') ||
      localStorage.getItem('currentUser') ||
      '';
    if (raw) {
      const parsed = JSON.parse(raw);
      storedName = parsed?.displayName || parsed?.name || parsed?.username || '';
    }
  } catch {
    // ignore
  }

  const detectedPrimary =
    urlLamacca ||
    globalUser?.displayName ||
    globalUser?.name ||
    globalUser?.username ||
    storedName ||
    'Pembalap LAMACCA';

  const detectedSecondary = urlToacca || 'Pembalap TOACCA';

  return {
    lamacca: detectedPrimary,
    toacca: detectedSecondary,
  };
}

export default function App() {
  const initialPlayers = detectInformatikaFunPlayers();

  const [lamaccaPlayer, setLamaccaPlayer] = useState<string>(initialPlayers.lamacca);
  const [toaccaPlayer, setToaccaPlayer] = useState<string>(initialPlayers.toacca);
  const [topicFilter, setTopicFilter] = useState<number>(0);
  const [topics, setTopics] = useState<TopicOption[]>(DEFAULT_TOPICS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [uiStatus, setUiStatus] = useState<RaceStatus>('preparing');
  const [countdownValue, setCountdownValue] = useState<number | 'GO' | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const [session, setSession] = useState<RaceSessionState | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [inspectPodiumOnly, setInspectPodiumOnly] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() =>
    soundEngine.getSettings(),
  );

  const [lamaccaFx, setLamaccaFx] = useState<BikeFXEvent>({ seq: 0, type: 'correct' });
  const [toaccaFx, setToaccaFx] = useState<BikeFXEvent>({ seq: 0, type: 'correct' });

  const countdownTimersRef = useRef<number[]>([]);

  const clearCountdownTimers = useCallback(() => {
    countdownTimersRef.current.forEach((id) => clearTimeout(id));
    countdownTimersRef.current = [];
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const [tpRes, lbRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/race/leaderboard'),
      ]);
      if (tpRes.ok) {
        const tpJson = await tpRes.json();
        if (Array.isArray(tpJson.topics) && tpJson.topics.length > 0) {
          setTopics(tpJson.topics);
        }
      }
      if (lbRes.ok) {
        const lbJson = await lbRes.json();
        if (Array.isArray(lbJson.leaderboard)) {
          setLeaderboard(lbJson.leaderboard);
        }
      }
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    return () => {
      clearCountdownTimers();
      soundEngine.dispose();
    };
  }, [fetchInitialData, clearCountdownTimers]);

  useEffect(() => {
    if (uiStatus !== 'racing' || !session) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - session.raceStartedAtMs) / 1000)),
      );
    }, 500);
    return () => clearInterval(interval);
  }, [uiStatus, session]);

  const handleAudioChange = useCallback(
    (next: AudioSettings) => {
      setAudioSettings(next);
      soundEngine.updateSettings(next);
      if (uiStatus === 'racing' && next.musicEnabled && !next.muted) {
        soundEngine.startRaceMusic();
      }
    },
    [uiStatus],
  );

  const handleStartRace = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);
    setErrorNotice(null);
    soundEngine.unlock();
    clearCountdownTimers();

    try {
      const res = await fetch('/api/race/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicFilter,
          lamaccaPlayer: lamaccaPlayer.trim() || 'Pembalap LAMACCA',
          toaccaPlayer: toaccaPlayer.trim() || 'Pembalap TOACCA',
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal memulai sesi balapan.');
      }

      const data = (await res.json()) as StartRaceResponse;
      setSession(data.session);
      setQuestions(data.questions);
      setElapsedSeconds(0);
      setHudCollapsed(false);
      setInspectPodiumOnly(false);
      setUiStatus('countdown');

      soundEngine.startEngineIdle();

      setCountdownValue(3);
      soundEngine.playCountdownBeep(false);

      const t1 = window.setTimeout(() => {
        setCountdownValue(2);
        soundEngine.playCountdownBeep(false);
      }, 950);

      const t2 = window.setTimeout(() => {
        setCountdownValue(1);
        soundEngine.playCountdownBeep(false);
      }, 1900);

      const t3 = window.setTimeout(() => {
        setCountdownValue('GO');
        soundEngine.playCountdownBeep(true);
        soundEngine.setCruiseMode(true);
      }, 2850);

      const t4 = window.setTimeout(async () => {
        setCountdownValue(null);
        setUiStatus('racing');
        soundEngine.setCruiseMode(true);
        soundEngine.startRaceMusic();
        try {
          const goRes = await fetch('/api/race/mark-go', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: data.session.sessionId }),
          });
          if (goRes.ok) {
            const goData = await goRes.json();
            setSession(goData.session);
          }
        } catch {
          // ignore
        }
      }, 3650);

      countdownTimersRef.current = [t1, t2, t3, t4];
    } catch (err) {
      setErrorNotice(
        err instanceof Error ? err.message : 'Terjadi kendala saat menyiapkan sirkuit.',
      );
      setUiStatus('preparing');
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, clearCountdownTimers, topicFilter, lamaccaPlayer, toaccaPlayer]);

  const transitionToVictory = useCallback(async (finishedSession: RaceSessionState) => {
    setSession(finishedSession);
    setUiStatus('finished');
    soundEngine.setCruiseMode(false);
    soundEngine.stopEngineIdle();
    soundEngine.playVictoryFanfareAndTrophy();
    try {
      const lbRes = await fetch('/api/race/leaderboard');
      if (lbRes.ok) {
        const lbJson = await lbRes.json();
        if (Array.isArray(lbJson.leaderboard)) {
          setLeaderboard(lbJson.leaderboard);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmitTeamAnswer = useCallback(
    async (team: TeamId, questionId: string, answer: unknown) => {
      if (!session || uiStatus !== 'racing') return;

      try {
        const res = await fetch('/api/race/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            team,
            questionId,
            answer,
          }),
        });

        if (!res.ok) return;

        const data = (await res.json()) as SubmitAnswerResponse;
        setSession(data.session);

        if (team === 'lamacca') {
          setLamaccaFx((prev) => ({
            seq: prev.seq + 1,
            type: data.teamResult.isCorrect ? 'correct' : 'wrong',
          }));
        } else {
          setToaccaFx((prev) => ({
            seq: prev.seq + 1,
            type: data.teamResult.isCorrect ? 'correct' : 'wrong',
          }));
        }

        if (data.teamResult.isCorrect) {
          soundEngine.playCorrectAcceleration(team);
        } else {
          soundEngine.playWrongEffect(team);
        }

        if (data.session.status === 'finished') {
          window.setTimeout(() => {
            transitionToVictory(data.session);
          }, 1150);
        }
      } catch {
        setErrorNotice('Koneksi ke server validasi terputus sementara. Coba kirim ulang.');
      }
    },
    [session, uiStatus, transitionToVictory],
  );

  const handleForceConcludeRace = useCallback(async () => {
    if (!session || uiStatus !== 'racing') return;
    try {
      const res = await fetch('/api/race/conclude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { session: RaceSessionState };
      if (data.session.status === 'finished') {
        transitionToVictory(data.session);
      }
    } catch {
      setErrorNotice('Gagal menyelesaikan sesi.');
    }
  }, [session, uiStatus, transitionToVictory]);

  const handleResetToPreparation = useCallback(() => {
    clearCountdownTimers();
    soundEngine.stopMusicLoop();
    soundEngine.stopEngineIdle();
    setCountdownValue(null);
    setUiStatus('preparing');
    setSession(null);
    setInspectPodiumOnly(false);
  }, [clearCountdownTimers]);

  const selectedTopicObj =
    topics.find((t) => t.topicFilter === topicFilter) ?? DEFAULT_TOPICS[0];

  const effectiveTotalSteps = session?.totalSteps ?? selectedTopicObj.count;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#070D19] text-[#F8FAFC]">
      <RaceArenaCanvas
        totalSteps={effectiveTotalSteps}
        lamaccaSteps={session?.lamacca.steps ?? 0}
        toaccaSteps={session?.toacca.steps ?? 0}
        lamaccaName={session?.lamacca.playerName ?? lamaccaPlayer}
        toaccaName={session?.toacca.playerName ?? toaccaPlayer}
        status={uiStatus}
        raceConcluded={session?.status === 'finished'}
        countdownValue={countdownValue}
        cameraMode={cameraMode}
        winner={session?.winner ?? null}
        hudCollapsed={hudCollapsed || inspectPodiumOnly}
        lamaccaFx={lamaccaFx}
        toaccaFx={toaccaFx}
      />

      <TopRaceHud
        status={uiStatus}
        session={session}
        elapsedSeconds={elapsedSeconds}
        cameraMode={cameraMode}
        onChangeCamera={setCameraMode}
        audioSettings={audioSettings}
        onChangeAudio={handleAudioChange}
        hudCollapsed={hudCollapsed}
        onToggleCollapse={() => setHudCollapsed((v) => !v)}
        onResetToPrep={handleResetToPreparation}
      />

      {errorNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-950/95 border border-rose-400/50 text-rose-100 text-xs px-4 py-2 rounded-xl shadow-xl flex items-center gap-3">
          <span>{errorNotice}</span>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-rose-300 hover:text-white font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {uiStatus === 'preparing' && (
        <PreparationScreen
          lamaccaPlayer={lamaccaPlayer}
          toaccaPlayer={toaccaPlayer}
          onChangeLamaccaPlayer={setLamaccaPlayer}
          onChangeToaccaPlayer={setToaccaPlayer}
          topicFilter={topicFilter}
          onChangeTopicFilter={setTopicFilter}
          topics={topics}
          onStartRace={handleStartRace}
          isStarting={isStarting}
          leaderboard={leaderboard}
        />
      )}

      {uiStatus === 'countdown' && <CountdownOverlay value={countdownValue} />}

      {uiStatus === 'racing' && session && questions.length > 0 && (
        <QuestionControlDock
          questions={questions}
          session={session}
          collapsed={hudCollapsed}
          onSubmitTeamAnswer={handleSubmitTeamAnswer}
          onForceConcludeRace={handleForceConcludeRace}
        />
      )}

      {uiStatus === 'finished' && session && (
        <VictoryScreen
          session={session}
          inspectPodiumOnly={inspectPodiumOnly}
          onToggleInspectPodium={() => setInspectPodiumOnly((v) => !v)}
          onRematch={handleStartRace}
          onBackToPreparation={handleResetToPreparation}
        />
      )}
    </main>
  );
}
