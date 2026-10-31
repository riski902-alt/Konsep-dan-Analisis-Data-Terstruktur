import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { CountdownOverlay } from './components/CountdownOverlay';
import { LevelBannerOverlay } from './components/LevelBannerOverlay';
import { PreparationScreen } from './components/PreparationScreen';
import { QuestionControlDock } from './components/QuestionControlDock';
import { TopRaceHud } from './components/TopRaceHud';
import { VictoryScreen } from './components/VictoryScreen';
import { RaceArenaCanvas, type BikeFXEvent } from './game3d/RaceArenaCanvas';
import { raceClient } from './services/raceClient';
import type {
  AudioSettings,
  CameraMode,
  LeaderboardEntry,
  PublicQuestion,
  RaceSessionState,
  RaceStatus,
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
    label: 'Semua Level Beruntun: Level 1 s/d Level 5 (100 Soal)',
    count: 100,
  },
  {
    topicFilter: 1,
    label: 'Level 1: Konsep Dasar Data: Data Terstruktur vs. Tidak Terstruktur (20 Soal)',
    count: 20,
  },
  {
    topicFilter: 2,
    label: 'Level 2: Pengidentifikasian dan Pemodelan Data Terstruktur (20 Soal)',
    count: 20,
  },
  {
    topicFilter: 3,
    label: 'Level 3: Antarmuka dan Elemen Dasar Lembar Kerja Pengolah Data (20 Soal)',
    count: 20,
  },
  {
    topicFilter: 4,
    label: 'Level 4: Pengolahan dan Pengorganisasian Data (20 Soal)',
    count: 20,
  },
  {
    topicFilter: 5,
    label: 'Level 5: Praktik Analisis dan Pengolahan Data Sederhana (20 Soal)',
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

  const [levelBanner, setLevelBanner] = useState<{
    level: number | null;
    triggeredByTeam: string | null;
  }>({ level: null, triggeredByTeam: null });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() =>
    soundEngine.getSettings(),
  );

  const [lamaccaFx, setLamaccaFx] = useState<BikeFXEvent>({ seq: 0, type: 'correct' });
  const [toaccaFx, setToaccaFx] = useState<BikeFXEvent>({ seq: 0, type: 'correct' });

  const countdownTimersRef = useRef<number[]>([]);
  const bannerTimerRef = useRef<number | null>(null);
  const prevLamaccaLevelRef = useRef<number>(0);
  const prevToaccaLevelRef = useRef<number>(0);

  const clearCountdownTimers = useCallback(() => {
    countdownTimersRef.current.forEach((id) => clearTimeout(id));
    countdownTimersRef.current = [];
  }, []);

  const clearBannerTimer = useCallback(() => {
    if (bannerTimerRef.current !== null) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
  }, []);

  const triggerLevelBanner = useCallback(
    (level: number, triggeredByTeam: string | null, durationMs = 3600) => {
      clearBannerTimer();
      setLevelBanner({ level, triggeredByTeam });
      bannerTimerRef.current = window.setTimeout(() => {
        setLevelBanner({ level: null, triggeredByTeam: null });
        bannerTimerRef.current = null;
      }, durationMs);
    },
    [clearBannerTimer],
  );

  const fetchInitialData = useCallback(async () => {
    try {
      const initData = await raceClient.getInitialData();
      if (Array.isArray(initData.topics) && initData.topics.length > 0) {
        setTopics(initData.topics);
      }
      if (Array.isArray(initData.leaderboard)) {
        setLeaderboard(initData.leaderboard);
      }
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    return () => {
      clearCountdownTimers();
      clearBannerTimer();
      soundEngine.dispose();
    };
  }, [fetchInitialData, clearCountdownTimers, clearBannerTimer]);

  useEffect(() => {
    if (uiStatus !== 'racing' || !session) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - session.raceStartedAtMs) / 1000)),
      );
    }, 500);
    return () => clearInterval(interval);
  }, [uiStatus, session]);

  // Compute each team's active Level (1..5) and global Arena Adrenaline Level
  const fallbackStartLevel = topicFilter === 0 ? 1 : topicFilter;
  const lamaccaActiveIdx = session
    ? Math.min(Math.max(0, questions.length - 1), session.lamacca.currentIndex)
    : 0;
  const toaccaActiveIdx = session
    ? Math.min(Math.max(0, questions.length - 1), session.toacca.currentIndex)
    : 0;

  const lamaccaLevel = questions[lamaccaActiveIdx]?.topicIndex ?? fallbackStartLevel;
  const toaccaLevel = questions[toaccaActiveIdx]?.topicIndex ?? fallbackStartLevel;
  const arenaLevel =
    uiStatus === 'preparing'
      ? fallbackStartLevel
      : Math.max(lamaccaLevel, toaccaLevel);

  // Escalate Adrenaline & show on-screen Level Announcement whenever a team advances to Level 2, 3, 4, or 5
  useEffect(() => {
    if (uiStatus !== 'racing' || !session) return;

    soundEngine.setAdrenalineLevel(arenaLevel);

    if (prevLamaccaLevelRef.current > 0 && lamaccaLevel > prevLamaccaLevelRef.current) {
      prevLamaccaLevelRef.current = lamaccaLevel;
      soundEngine.playLevelUpAdrenaline(lamaccaLevel);
      triggerLevelBanner(lamaccaLevel, 'TIM LAMACCA MEMASUKI LEVEL BARU!', 3800);
    }

    if (prevToaccaLevelRef.current > 0 && toaccaLevel > prevToaccaLevelRef.current) {
      prevToaccaLevelRef.current = toaccaLevel;
      soundEngine.playLevelUpAdrenaline(toaccaLevel);
      triggerLevelBanner(toaccaLevel, 'TIM TOACCA MEMASUKI LEVEL BARU!', 3800);
    }
  }, [uiStatus, session, lamaccaLevel, toaccaLevel, arenaLevel, triggerLevelBanner]);

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
    clearBannerTimer();
    setLevelBanner({ level: null, triggeredByTeam: null });

    try {
      const data = await raceClient.startRace(
        topicFilter,
        lamaccaPlayer.trim() || 'Pembalap LAMACCA',
        toaccaPlayer.trim() || 'Pembalap TOACCA',
      );

      const startLvl =
        data.questions[0]?.topicIndex ?? (topicFilter === 0 ? 1 : topicFilter);

      prevLamaccaLevelRef.current = 0;
      prevToaccaLevelRef.current = 0;
      soundEngine.setAdrenalineLevel(startLvl);

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
        prevLamaccaLevelRef.current = startLvl;
        prevToaccaLevelRef.current = startLvl;
        setUiStatus('racing');
        soundEngine.setAdrenalineLevel(startLvl);
        soundEngine.setCruiseMode(true);
        soundEngine.startRaceMusic();
        soundEngine.playLevelUpAdrenaline(startLvl);
        triggerLevelBanner(startLvl, 'SIRKUIT BALAP DIMULAI', 3600);
        try {
          const goSession = await raceClient.markGo(data.session.sessionId);
          if (goSession) {
            setSession(goSession);
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
  }, [
    isStarting,
    clearCountdownTimers,
    clearBannerTimer,
    triggerLevelBanner,
    topicFilter,
    lamaccaPlayer,
    toaccaPlayer,
  ]);

  const transitionToVictory = useCallback(
    async (finishedSession: RaceSessionState) => {
      clearBannerTimer();
      setLevelBanner({ level: null, triggeredByTeam: null });
      setSession(finishedSession);
      setUiStatus('finished');
      soundEngine.setCruiseMode(false);
      soundEngine.stopEngineIdle();
      soundEngine.playVictoryFanfareAndTrophy();
      try {
        const lb = await raceClient.getLeaderboard();
        setLeaderboard(lb);
      } catch {
        // ignore
      }
    },
    [clearBannerTimer],
  );

  const handleSubmitTeamAnswer = useCallback(
    async (team: TeamId, questionId: string, answer: unknown) => {
      if (!session || uiStatus !== 'racing') return;

      try {
        const data = await raceClient.submitAnswer(
          session.sessionId,
          team,
          questionId,
          answer,
        );
        if (!data) return;

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
        setErrorNotice('Terjadi kendala saat memproses jawaban. Coba klik ulang.');
      }
    },
    [session, uiStatus, transitionToVictory],
  );

  const handleForceConcludeRace = useCallback(async () => {
    if (!session || uiStatus !== 'racing') return;
    try {
      const concluded = await raceClient.concludeRace(session.sessionId);
      if (concluded && concluded.status === 'finished') {
        transitionToVictory(concluded);
      }
    } catch {
      setErrorNotice('Gagal menyelesaikan sesi.');
    }
  }, [session, uiStatus, transitionToVictory]);

  const handleResetToPreparation = useCallback(() => {
    clearCountdownTimers();
    clearBannerTimer();
    setLevelBanner({ level: null, triggeredByTeam: null });
    prevLamaccaLevelRef.current = 0;
    prevToaccaLevelRef.current = 0;
    soundEngine.stopMusicLoop();
    soundEngine.stopEngineIdle();
    soundEngine.setAdrenalineLevel(1);
    setCountdownValue(null);
    setUiStatus('preparing');
    setSession(null);
    setInspectPodiumOnly(false);
  }, [clearCountdownTimers, clearBannerTimer]);

  const selectedTopicObj =
    topics.find((t) => t.topicFilter === topicFilter) ?? DEFAULT_TOPICS[0];

  const effectiveTotalSteps = session?.totalSteps ?? selectedTopicObj.count;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#070D19] text-[#F8FAFC]">
      <RaceArenaCanvas
        totalSteps={effectiveTotalSteps}
        arenaLevel={arenaLevel}
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
        arenaLevel={arenaLevel}
        elapsedSeconds={elapsedSeconds}
        cameraMode={cameraMode}
        onChangeCamera={setCameraMode}
        audioSettings={audioSettings}
        onChangeAudio={handleAudioChange}
        hudCollapsed={hudCollapsed}
        onToggleCollapse={() => setHudCollapsed((v) => !v)}
        onResetToPrep={handleResetToPreparation}
      />

      {uiStatus === 'racing' && (
        <LevelBannerOverlay
          level={levelBanner.level}
          triggeredByTeam={levelBanner.triggeredByTeam}
        />
      )}

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
