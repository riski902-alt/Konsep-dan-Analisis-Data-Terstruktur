import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Flag,
  Flame,
  Keyboard,
  Link2,
  Timer,
  XCircle,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getLevelConfig, getQuestionTimeLimitSec } from '../config/levels';
import type {
  PublicQuestion,
  RaceSessionState,
  TeamId,
} from '../types/game';

interface QuestionControlDockProps {
  questions: PublicQuestion[];
  session: RaceSessionState;
  collapsed: boolean;
  onSubmitTeamAnswer: (team: TeamId, questionId: string, answer: unknown) => Promise<void>;
  onForceConcludeRace: () => Promise<void>;
}

interface TeamDeadlineTracker {
  qId: string;
  deadlineMs: number;
  totalMs: number;
  timedOut: boolean;
}

const MINI_KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '0', '1', '2', '3', '4'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '5', '6', '7', '8', '9'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '=', '+', '-', '*', ':', '/', '.'],
];

export const QuestionControlDock: React.FC<QuestionControlDockProps> = ({
  questions,
  session,
  collapsed,
  onSubmitTeamAnswer,
  onForceConcludeRace,
}) => {
  const lamaccaQuestion: PublicQuestion | null =
    !session.lamacca.completedAllQuestions && questions[session.lamacca.currentIndex]
      ? questions[session.lamacca.currentIndex]
      : null;

  const toaccaQuestion: PublicQuestion | null =
    !session.toacca.completedAllQuestions && questions[session.toacca.currentIndex]
      ? questions[session.toacca.currentIndex]
      : null;

  // Draft states only needed for multi-select PGK (until Nth click auto-submits) and ISIAN text
  const [lamaccaPGK, setLamaccaPGK] = useState<Array<'A' | 'B' | 'C' | 'D'>>([]);
  const [lamaccaText, setLamaccaText] = useState<string>('');
  const [showLamaccaPad, setShowLamaccaPad] = useState<boolean>(false);
  const [submittingL, setSubmittingL] = useState<boolean>(false);

  const [toaccaPGK, setToaccaPGK] = useState<Array<'A' | 'B' | 'C' | 'D'>>([]);
  const [toaccaText, setToaccaText] = useState<string>('');
  const [showToaccaPad, setShowToaccaPad] = useState<boolean>(false);
  const [submittingT, setSubmittingT] = useState<boolean>(false);

  const [dragOverTeam, setDragOverTeam] = useState<TeamId | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Per-player level transition notice inside each player's own question box
  const [lamaccaEntryNoticeLvl, setLamaccaEntryNoticeLvl] = useState<number | null>(null);
  const [toaccaEntryNoticeLvl, setToaccaEntryNoticeLvl] = useState<number | null>(null);

  // Per-team anti-double-click guard (280ms) so fast clicks don't accidentally hit the newly arrived question
  const lastSubmitLamaccaMs = useRef<number>(0);
  const lastSubmitToaccaMs = useRef<number>(0);

  // Per-team Adrenaline countdown deadline trackers
  const lamaccaDeadlineRef = useRef<TeamDeadlineTracker>({
    qId: '',
    deadlineMs: 0,
    totalMs: 30000,
    timedOut: false,
  });
  const toaccaDeadlineRef = useRef<TeamDeadlineTracker>({
    qId: '',
    deadlineMs: 0,
    totalMs: 30000,
    timedOut: false,
  });
  const lastWarnStampRef = useRef<string>('');

  const submitLamaccaDirect = useCallback(
    async (questionId: string, payload: unknown) => {
      if (session.lamacca.completedAllQuestions || submittingL) return;
      const isTimeout = payload === '__TIMEOUT__';
      if (!isTimeout && Date.now() - lastSubmitLamaccaMs.current < 280) return;

      lastSubmitLamaccaMs.current = Date.now();
      setSubmittingL(true);
      try {
        await onSubmitTeamAnswer('lamacca', questionId, payload);
      } finally {
        setSubmittingL(false);
      }
    },
    [session.lamacca.completedAllQuestions, submittingL, onSubmitTeamAnswer],
  );

  const submitToaccaDirect = useCallback(
    async (questionId: string, payload: unknown) => {
      if (session.toacca.completedAllQuestions || submittingT) return;
      const isTimeout = payload === '__TIMEOUT__';
      if (!isTimeout && Date.now() - lastSubmitToaccaMs.current < 280) return;

      lastSubmitToaccaMs.current = Date.now();
      setSubmittingT(true);
      try {
        await onSubmitTeamAnswer('toacca', questionId, payload);
      } finally {
        setSubmittingT(false);
      }
    },
    [session.toacca.completedAllQuestions, submittingT, onSubmitTeamAnswer],
  );

  // Reset ONLY LAMACCA's draft & Adrenaline timer when LAMACCA advances to their next question
  useEffect(() => {
    setLamaccaPGK([]);
    setLamaccaText('');
    setSubmittingL(false);
    if (lamaccaQuestion) {
      const limitMs =
        getQuestionTimeLimitSec(lamaccaQuestion.topicIndex, lamaccaQuestion.type) * 1000;
      const now = Date.now();
      lamaccaDeadlineRef.current = {
        qId: lamaccaQuestion.id,
        deadlineMs: now + limitMs,
        totalMs: limitMs,
        timedOut: false,
      };
      setNowMs(now);
    }
  }, [lamaccaQuestion?.id, lamaccaQuestion?.topicIndex, lamaccaQuestion?.type]);

  // Reset ONLY TOACCA's draft & Adrenaline timer when TOACCA advances to their next question
  useEffect(() => {
    setToaccaPGK([]);
    setToaccaText('');
    setSubmittingT(false);
    if (toaccaQuestion) {
      const limitMs =
        getQuestionTimeLimitSec(toaccaQuestion.topicIndex, toaccaQuestion.type) * 1000;
      const now = Date.now();
      toaccaDeadlineRef.current = {
        qId: toaccaQuestion.id,
        deadlineMs: now + limitMs,
        totalMs: limitMs,
        timedOut: false,
      };
      setNowMs(now);
    }
  }, [toaccaQuestion?.id, toaccaQuestion?.topicIndex, toaccaQuestion?.type]);

  // Show per-box Level Entry notice whenever LAMACCA enters a new Level (1, 2, 3, 4, 5)
  useEffect(() => {
    if (!lamaccaQuestion) return;
    setLamaccaEntryNoticeLvl(lamaccaQuestion.topicIndex);
    const id = window.setTimeout(() => {
      setLamaccaEntryNoticeLvl(null);
    }, 4500);
    return () => clearTimeout(id);
  }, [lamaccaQuestion?.topicIndex]);

  // Show per-box Level Entry notice whenever TOACCA enters a new Level (1, 2, 3, 4, 5)
  useEffect(() => {
    if (!toaccaQuestion) return;
    setToaccaEntryNoticeLvl(toaccaQuestion.topicIndex);
    const id = window.setTimeout(() => {
      setToaccaEntryNoticeLvl(null);
    }, 4500);
    return () => clearTimeout(id);
  }, [toaccaQuestion?.topicIndex]);

  // Live 100ms Adrenaline Timer loop (auto-advances on timeout & plays warning ticks at 3s, 2s, 1s)
  useEffect(() => {
    if (session.status !== 'racing') return;

    const timer = window.setInterval(() => {
      const now = Date.now();
      setNowMs(now);

      let urgentSec: number | null = null;

      if (
        lamaccaQuestion &&
        !session.lamacca.completedAllQuestions &&
        lamaccaDeadlineRef.current.qId === lamaccaQuestion.id &&
        !lamaccaDeadlineRef.current.timedOut
      ) {
        const remL = lamaccaDeadlineRef.current.deadlineMs - now;
        const ceilL = Math.ceil(remL / 1000);
        if (ceilL >= 1 && ceilL <= 3) {
          urgentSec = urgentSec === null ? ceilL : Math.min(urgentSec, ceilL);
        }
        if (remL <= 0) {
          lamaccaDeadlineRef.current.timedOut = true;
          void submitLamaccaDirect(lamaccaQuestion.id, '__TIMEOUT__');
        }
      }

      if (
        toaccaQuestion &&
        !session.toacca.completedAllQuestions &&
        toaccaDeadlineRef.current.qId === toaccaQuestion.id &&
        !toaccaDeadlineRef.current.timedOut
      ) {
        const remT = toaccaDeadlineRef.current.deadlineMs - now;
        const ceilT = Math.ceil(remT / 1000);
        if (ceilT >= 1 && ceilT <= 3) {
          urgentSec = urgentSec === null ? ceilT : Math.min(urgentSec, ceilT);
        }
        if (remT <= 0) {
          toaccaDeadlineRef.current.timedOut = true;
          void submitToaccaDirect(toaccaQuestion.id, '__TIMEOUT__');
        }
      }

      if (urgentSec !== null) {
        const stamp = `${lamaccaQuestion?.id ?? ''}_${toaccaQuestion?.id ?? ''}_${urgentSec}`;
        if (lastWarnStampRef.current !== stamp) {
          lastWarnStampRef.current = stamp;
          soundEngine.playTimerWarningTick();
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [
    session.status,
    session.lamacca.completedAllQuestions,
    session.toacca.completedAllQuestions,
    lamaccaQuestion,
    toaccaQuestion,
    submitLamaccaDirect,
    submitToaccaDirect,
  ]);

  const handleLamaccaOptionClick = (q: PublicQuestion, optKey: 'A' | 'B' | 'C' | 'D') => {
    if (q.type === 'PG') {
      void submitLamaccaDirect(q.id, optKey);
      return;
    }

    const reqCount = q.pgkRequiredCount ?? 2;
    const exists = lamaccaPGK.includes(optKey);
    const next = exists
      ? lamaccaPGK.filter((k) => k !== optKey)
      : [...lamaccaPGK, optKey];

    setLamaccaPGK(next);
    if (!exists && next.length >= reqCount) {
      void submitLamaccaDirect(q.id, next);
    }
  };

  const handleToaccaOptionClick = (q: PublicQuestion, optKey: 'A' | 'B' | 'C' | 'D') => {
    if (q.type === 'PG') {
      void submitToaccaDirect(q.id, optKey);
      return;
    }

    const reqCount = q.pgkRequiredCount ?? 2;
    const exists = toaccaPGK.includes(optKey);
    const next = exists
      ? toaccaPGK.filter((k) => k !== optKey)
      : [...toaccaPGK, optKey];

    setToaccaPGK(next);
    if (!exists && next.length >= reqCount) {
      void submitToaccaDirect(q.id, next);
    }
  };

  if (collapsed) return null;

  // Compute LAMACCA Level & Adrenaline timer progress
  const lamaccaLvlCfg = lamaccaQuestion ? getLevelConfig(lamaccaQuestion.topicIndex) : null;
  const lamaccaFallbackTotalMs = lamaccaQuestion
    ? getQuestionTimeLimitSec(lamaccaQuestion.topicIndex, lamaccaQuestion.type) * 1000
    : 30000;
  const lamaccaTotalMs =
    lamaccaQuestion && lamaccaDeadlineRef.current.qId === lamaccaQuestion.id
      ? lamaccaDeadlineRef.current.totalMs
      : lamaccaFallbackTotalMs;
  const lamaccaRemMs =
    lamaccaQuestion && lamaccaDeadlineRef.current.qId === lamaccaQuestion.id
      ? Math.max(0, lamaccaDeadlineRef.current.deadlineMs - nowMs)
      : lamaccaFallbackTotalMs;
  const lamaccaRemSec = Math.ceil(lamaccaRemMs / 1000);
  const lamaccaTimerRatio = Math.max(0, Math.min(1, lamaccaRemMs / Math.max(1, lamaccaTotalMs)));
  const showLamaccaLevelCard =
    lamaccaQuestion !== null &&
    (lamaccaEntryNoticeLvl === lamaccaQuestion.topicIndex ||
      lamaccaQuestion.numberInTopic === 1);

  // Compute TOACCA Level & Adrenaline timer progress
  const toaccaLvlCfg = toaccaQuestion ? getLevelConfig(toaccaQuestion.topicIndex) : null;
  const toaccaFallbackTotalMs = toaccaQuestion
    ? getQuestionTimeLimitSec(toaccaQuestion.topicIndex, toaccaQuestion.type) * 1000
    : 30000;
  const toaccaTotalMs =
    toaccaQuestion && toaccaDeadlineRef.current.qId === toaccaQuestion.id
      ? toaccaDeadlineRef.current.totalMs
      : toaccaFallbackTotalMs;
  const toaccaRemMs =
    toaccaQuestion && toaccaDeadlineRef.current.qId === toaccaQuestion.id
      ? Math.max(0, toaccaDeadlineRef.current.deadlineMs - nowMs)
      : toaccaFallbackTotalMs;
  const toaccaRemSec = Math.ceil(toaccaRemMs / 1000);
  const toaccaTimerRatio = Math.max(0, Math.min(1, toaccaRemMs / Math.max(1, toaccaTotalMs)));
  const showToaccaLevelCard =
    toaccaQuestion !== null &&
    (toaccaEntryNoticeLvl === toaccaQuestion.topicIndex ||
      toaccaQuestion.numberInTopic === 1);

  return (
    <section
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-20 w-[min(1380px,97vw)] pointer-events-auto"
      aria-label="Kotak Pertanyaan dan Jawaban Mandiri Dua Pemain"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-stretch">
        {/* ================================================================= */}
        {/* KOTAK MANDIRI TIM 1: LAMACCA (JALUR KIRI)                         */}
        {/* ================================================================= */}
        <div
          onDragOver={(e) => {
            if (lamaccaQuestion?.type === 'MENJODOHKAN') {
              e.preventDefault();
              setDragOverTeam('lamacca');
            }
          }}
          onDragLeave={() => setDragOverTeam(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverTeam(null);
            if (lamaccaQuestion?.type === 'MENJODOHKAN') {
              const dropped = e.dataTransfer.getData('text/plain');
              if (dropped) {
                void submitLamaccaDirect(lamaccaQuestion.id, dropped);
              }
            }
          }}
          className={`rounded-xl bg-[#070D19]/92 border px-3 py-2 shadow-2xl max-h-[40vh] overflow-y-auto racing-scroll flex flex-col justify-between transition-colors ${
            dragOverTeam === 'lamacca'
              ? 'border-[#38BDF8] bg-[#0B172A]/95'
              : 'border-[#426A9B]/75'
          }`}
        >
          <div>
            {/* LAMACCA Header with Level & Adrenaline Status */}
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-display font-bold text-xs text-[#38BDF8] whitespace-nowrap">
                  TIM LAMACCA
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  · {session.lamacca.playerName}
                </span>
                {lamaccaLvlCfg && (
                  <span
                    className={`hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono-num font-bold whitespace-nowrap ${lamaccaLvlCfg.uiTextClass}`}
                  >
                    · <Flame className="w-3 h-3" /> LEVEL {lamaccaLvlCfg.level}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono-num">
                {lamaccaQuestion && (
                  <span
                    className={`inline-flex items-center gap-0.5 font-bold ${
                      lamaccaRemSec <= 5
                        ? 'text-rose-400'
                        : lamaccaRemSec <= 10
                          ? 'text-amber-300'
                          : 'text-[#38BDF8]'
                    }`}
                  >
                    <Timer className="w-3 h-3" />
                    <span>{lamaccaRemSec}d</span>
                  </span>
                )}
                <span className="text-slate-300">
                  Soal{' '}
                  <strong className="text-white">
                    {Math.min(session.totalQuestions, session.lamacca.currentIndex + 1)}
                  </strong>
                  /{session.totalQuestions}
                </span>
                <span className="text-emerald-400">B:{session.lamacca.correctCount}</span>
                <span className="text-rose-400">S:{session.lamacca.wrongCount}</span>
              </div>
            </div>

            {/* Adrenaline Countdown Bar */}
            {lamaccaQuestion && (
              <div className="mt-1 h-1 w-full bg-slate-800/90 rounded-full overflow-hidden">
                <div
                  className={`h-full origin-left transition-transform duration-100 ${
                    lamaccaTimerRatio <= 0.22
                      ? 'bg-rose-500'
                      : lamaccaTimerRatio <= 0.45
                        ? 'bg-amber-400'
                        : 'bg-[#38BDF8]'
                  }`}
                  style={{ transform: `scaleX(${lamaccaTimerRatio})` }}
                />
              </div>
            )}

            {/* On-Screen Keterangan Level Banner when entering Level 1, Level 2, Level 3, Level 4, Level 5 */}
            {showLamaccaLevelCard && lamaccaLvlCfg && lamaccaQuestion && (
              <div
                className={`mt-1.5 rounded-lg px-2.5 py-1 border ${lamaccaLvlCfg.uiBgClass} ${lamaccaLvlCfg.uiBorderClass} flex flex-wrap items-center justify-between gap-1 text-[11px]`}
              >
                <span className="font-display font-bold text-white tracking-wide">
                  LEVEL {lamaccaLvlCfg.level}: {lamaccaLvlCfg.materialTitle}
                </span>
                <span className={`font-mono-num text-[10px] font-semibold ${lamaccaLvlCfg.uiTextClass}`}>
                  {lamaccaLvlCfg.adrenalineBadge} · Laju {lamaccaLvlCfg.speedMultiplierLabel} · Batas {Math.round(lamaccaTotalMs / 1000)}d
                </span>
              </div>
            )}

            {/* Instant Makassar–Sinjai Feedback Strip (Non-Blocking) */}
            {session.lamacca.lastFeedback && (
              <div
                className={`mt-1 rounded px-2 py-0.5 border flex items-center gap-1.5 text-[10px] leading-tight ${
                  session.lamacca.lastFeedback.isCorrect
                    ? 'bg-emerald-950/65 border-emerald-400/40 text-emerald-100'
                    : 'bg-rose-950/65 border-rose-400/40 text-rose-100'
                }`}
              >
                {session.lamacca.lastFeedback.isCorrect ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                )}
                <span className="truncate">
                  <strong>
                    Soal #{session.lamacca.lastFeedback.questionNumber}{' '}
                    {session.lamacca.lastFeedback.isCorrect ? 'BENAR (+1): ' : 'BELUM TEPAT: '}
                  </strong>
                  "{session.lamacca.lastFeedback.message}"
                </span>
              </div>
            )}

            {/* LAMACCA Question Body or Completed State */}
            {session.lamacca.completedAllQuestions || !lamaccaQuestion ? (
              <div className="py-4 text-center space-y-2">
                <Flag className="w-6 h-6 text-[#38BDF8] mx-auto" />
                <p className="font-display font-bold text-sm text-white">
                  SELURUH LEVEL TIM LAMACCA SELESAI!
                </p>
                <p className="text-xs text-slate-300">
                  Total Langkah:{' '}
                  <strong className="text-[#38BDF8] font-mono-num">
                    {session.lamacca.steps}/{session.totalSteps}
                  </strong>{' '}
                  · Menunggu Tim TOACCA menyelesaikan sisa soal...
                </p>
                <button
                  type="button"
                  onClick={onForceConcludeRace}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-[11px] text-[#FBBF24] cursor-pointer"
                >
                  Akhiri & Tampilkan Podium Sekarang
                </button>
              </div>
            ) : (
              <div className="mt-1">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 mb-0.5">
                  <span className="truncate max-w-[82%]">
                    <strong className={lamaccaLvlCfg?.uiTextClass ?? 'text-[#38BDF8]'}>
                      Level {lamaccaQuestion.topicIndex} ({lamaccaQuestion.numberInTopic}/20)
                    </strong>{' '}
                    · <span className="text-slate-300">{lamaccaQuestion.topicTitle}</span> ·{' '}
                    <span className="text-[#FBBF24] font-semibold">
                      {lamaccaQuestion.categoryTitle}
                    </span>
                    {lamaccaQuestion.categoryNote && (
                      <span className="text-slate-300 ml-1">{lamaccaQuestion.categoryNote}</span>
                    )}
                  </span>

                  {lamaccaQuestion.type === 'PGK' && (
                    <span className="font-mono-num text-[10px] text-[#38BDF8] font-semibold">
                      Pilih {lamaccaQuestion.pgkRequiredCount ?? 2} ({lamaccaPGK.length}/
                      {lamaccaQuestion.pgkRequiredCount ?? 2})
                    </span>
                  )}

                  {lamaccaQuestion.type === 'ISIAN' && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowLamaccaPad((v) => !v)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-white/15 text-slate-300 hover:text-white cursor-pointer"
                    >
                      <Keyboard className="w-2.5 h-2.5" />
                      <span>Pad</span>
                    </button>
                  )}
                </div>

                {/* Verbatim Question Text */}
                <p className="text-xs font-semibold text-white leading-snug">
                  {lamaccaQuestion.questionText}
                </p>

                {/* LAMACCA PG / PGK Direct-Click Options */}
                {(lamaccaQuestion.type === 'PG' || lamaccaQuestion.type === 'PGK') &&
                  lamaccaQuestion.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5">
                      {lamaccaQuestion.options.map((opt) => {
                        const selected =
                          lamaccaQuestion.type === 'PGK' && lamaccaPGK.includes(opt.key);
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={submittingL}
                            onClick={() => handleLamaccaOptionClick(lamaccaQuestion, opt.key)}
                            className={`text-left flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] leading-snug transition-colors cursor-pointer disabled:opacity-60 ${
                              selected
                                ? 'bg-[#426A9B]/40 border-[#38BDF8] text-white font-semibold'
                                : 'bg-slate-900/90 border-white/12 text-slate-100 hover:bg-[#0B1F3A] hover:border-[#38BDF8]/70 active:bg-[#38BDF8]/25'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {selected && (
                              <Check className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                {/* LAMACCA MENJODOHKAN Direct-Click Choices */}
                {lamaccaQuestion.type === 'MENJODOHKAN' &&
                  lamaccaQuestion.matchingChoices && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
                      {lamaccaQuestion.matchingChoices.map((mc) => (
                        <button
                          key={mc.id}
                          type="button"
                          draggable
                          disabled={submittingL}
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', mc.text)}
                          onClick={() => void submitLamaccaDirect(lamaccaQuestion.id, mc.text)}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg border border-white/15 bg-slate-900/90 hover:bg-[#0B1F3A] hover:border-[#38BDF8] active:bg-[#38BDF8]/25 text-[11px] font-medium text-slate-100 transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <span>{mc.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                {/* LAMACCA ISIAN SINGKAT Input */}
                {lamaccaQuestion.type === 'ISIAN' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (lamaccaText.trim()) {
                        void submitLamaccaDirect(lamaccaQuestion.id, lamaccaText.trim());
                      }
                    }}
                    className="mt-1.5 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={lamaccaText}
                        onChange={(e) => setLamaccaText(e.target.value)}
                        placeholder="Ketik jawaban singkat Tim LAMACCA..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0B172A] border border-[#38BDF8]/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                      />
                      <button
                        type="submit"
                        disabled={submittingL || !lamaccaText.trim()}
                        className="px-3 py-1.5 rounded-lg bg-[#38BDF8] hover:brightness-110 disabled:opacity-45 text-slate-950 font-semibold text-xs whitespace-nowrap cursor-pointer"
                      >
                        Jawab
                      </button>
                    </div>

                    {showLamaccaPad && (
                      <div className="space-y-0.5 pt-0.5">
                        {MINI_KEY_ROWS.map((row, rIdx) => (
                          <div key={rIdx} className="flex flex-wrap gap-0.5">
                            {row.map((ch) => (
                              <button
                                key={ch}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setLamaccaText((p) => p + ch)}
                                className="px-1.5 py-0.5 min-w-[20px] rounded bg-slate-900 hover:bg-slate-700 text-[10px] font-mono-num text-slate-200 border border-white/10 cursor-pointer"
                              >
                                {ch}
                              </button>
                            ))}
                            {rIdx === 2 && (
                              <>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => setLamaccaText((p) => p + ' ')}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 border border-white/10 cursor-pointer"
                                >
                                  Spasi
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => setLamaccaText('')}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 border border-white/10 cursor-pointer"
                                >
                                  Reset
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* KOTAK MANDIRI TIM 2: TOACCA (JALUR KANAN)                         */}
        {/* ================================================================= */}
        <div
          onDragOver={(e) => {
            if (toaccaQuestion?.type === 'MENJODOHKAN') {
              e.preventDefault();
              setDragOverTeam('toacca');
            }
          }}
          onDragLeave={() => setDragOverTeam(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverTeam(null);
            if (toaccaQuestion?.type === 'MENJODOHKAN') {
              const dropped = e.dataTransfer.getData('text/plain');
              if (dropped) {
                void submitToaccaDirect(toaccaQuestion.id, dropped);
              }
            }
          }}
          className={`rounded-xl bg-[#070D19]/92 border px-3 py-2 shadow-2xl max-h-[40vh] overflow-y-auto racing-scroll flex flex-col justify-between transition-colors ${
            dragOverTeam === 'toacca'
              ? 'border-[#34D399] bg-[#091C18]/95'
              : 'border-[#16A34A]/75'
          }`}
        >
          <div>
            {/* TOACCA Header with Level & Adrenaline Status */}
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-display font-bold text-xs text-[#34D399] whitespace-nowrap">
                  TIM TOACCA
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  · {session.toacca.playerName}
                </span>
                {toaccaLvlCfg && (
                  <span
                    className={`hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono-num font-bold whitespace-nowrap ${toaccaLvlCfg.uiTextClass}`}
                  >
                    · <Flame className="w-3 h-3" /> LEVEL {toaccaLvlCfg.level}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono-num">
                {toaccaQuestion && (
                  <span
                    className={`inline-flex items-center gap-0.5 font-bold ${
                      toaccaRemSec <= 5
                        ? 'text-rose-400'
                        : toaccaRemSec <= 10
                          ? 'text-amber-300'
                          : 'text-[#34D399]'
                    }`}
                  >
                    <Timer className="w-3 h-3" />
                    <span>{toaccaRemSec}d</span>
                  </span>
                )}
                <span className="text-slate-300">
                  Soal{' '}
                  <strong className="text-white">
                    {Math.min(session.totalQuestions, session.toacca.currentIndex + 1)}
                  </strong>
                  /{session.totalQuestions}
                </span>
                <span className="text-emerald-400">B:{session.toacca.correctCount}</span>
                <span className="text-rose-400">S:{session.toacca.wrongCount}</span>
              </div>
            </div>

            {/* Adrenaline Countdown Bar */}
            {toaccaQuestion && (
              <div className="mt-1 h-1 w-full bg-slate-800/90 rounded-full overflow-hidden">
                <div
                  className={`h-full origin-left transition-transform duration-100 ${
                    toaccaTimerRatio <= 0.22
                      ? 'bg-rose-500'
                      : toaccaTimerRatio <= 0.45
                        ? 'bg-amber-400'
                        : 'bg-[#34D399]'
                  }`}
                  style={{ transform: `scaleX(${toaccaTimerRatio})` }}
                />
              </div>
            )}

            {/* On-Screen Keterangan Level Banner when entering Level 1, Level 2, Level 3, Level 4, Level 5 */}
            {showToaccaLevelCard && toaccaLvlCfg && toaccaQuestion && (
              <div
                className={`mt-1.5 rounded-lg px-2.5 py-1 border ${toaccaLvlCfg.uiBgClass} ${toaccaLvlCfg.uiBorderClass} flex flex-wrap items-center justify-between gap-1 text-[11px]`}
              >
                <span className="font-display font-bold text-white tracking-wide">
                  LEVEL {toaccaLvlCfg.level}: {toaccaLvlCfg.materialTitle}
                </span>
                <span className={`font-mono-num text-[10px] font-semibold ${toaccaLvlCfg.uiTextClass}`}>
                  {toaccaLvlCfg.adrenalineBadge} · Laju {toaccaLvlCfg.speedMultiplierLabel} · Batas {Math.round(toaccaTotalMs / 1000)}d
                </span>
              </div>
            )}

            {/* Instant Makassar–Sinjai Feedback Strip (Non-Blocking) */}
            {session.toacca.lastFeedback && (
              <div
                className={`mt-1 rounded px-2 py-0.5 border flex items-center gap-1.5 text-[10px] leading-tight ${
                  session.toacca.lastFeedback.isCorrect
                    ? 'bg-emerald-950/65 border-emerald-400/40 text-emerald-100'
                    : 'bg-rose-950/65 border-rose-400/40 text-rose-100'
                }`}
              >
                {session.toacca.lastFeedback.isCorrect ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                )}
                <span className="truncate">
                  <strong>
                    Soal #{session.toacca.lastFeedback.questionNumber}{' '}
                    {session.toacca.lastFeedback.isCorrect ? 'BENAR (+1): ' : 'BELUM TEPAT: '}
                  </strong>
                  "{session.toacca.lastFeedback.message}"
                </span>
              </div>
            )}

            {/* TOACCA Question Body or Completed State */}
            {session.toacca.completedAllQuestions || !toaccaQuestion ? (
              <div className="py-4 text-center space-y-2">
                <Flag className="w-6 h-6 text-[#34D399] mx-auto" />
                <p className="font-display font-bold text-sm text-white">
                  SELURUH LEVEL TIM TOACCA SELESAI!
                </p>
                <p className="text-xs text-slate-300">
                  Total Langkah:{' '}
                  <strong className="text-[#34D399] font-mono-num">
                    {session.toacca.steps}/{session.totalSteps}
                  </strong>{' '}
                  · Menunggu Tim LAMACCA menyelesaikan sisa soal...
                </p>
                <button
                  type="button"
                  onClick={onForceConcludeRace}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-[11px] text-[#FBBF24] cursor-pointer"
                >
                  Akhiri & Tampilkan Podium Sekarang
                </button>
              </div>
            ) : (
              <div className="mt-1">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 mb-0.5">
                  <span className="truncate max-w-[82%]">
                    <strong className={toaccaLvlCfg?.uiTextClass ?? 'text-[#34D399]'}>
                      Level {toaccaQuestion.topicIndex} ({toaccaQuestion.numberInTopic}/20)
                    </strong>{' '}
                    · <span className="text-slate-300">{toaccaQuestion.topicTitle}</span> ·{' '}
                    <span className="text-[#FBBF24] font-semibold">
                      {toaccaQuestion.categoryTitle}
                    </span>
                    {toaccaQuestion.categoryNote && (
                      <span className="text-slate-300 ml-1">{toaccaQuestion.categoryNote}</span>
                    )}
                  </span>

                  {toaccaQuestion.type === 'PGK' && (
                    <span className="font-mono-num text-[10px] text-[#34D399] font-semibold">
                      Pilih {toaccaQuestion.pgkRequiredCount ?? 2} ({toaccaPGK.length}/
                      {toaccaQuestion.pgkRequiredCount ?? 2})
                    </span>
                  )}

                  {toaccaQuestion.type === 'ISIAN' && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowToaccaPad((v) => !v)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-white/15 text-slate-300 hover:text-white cursor-pointer"
                    >
                      <Keyboard className="w-2.5 h-2.5" />
                      <span>Pad</span>
                    </button>
                  )}
                </div>

                {/* Verbatim Question Text */}
                <p className="text-xs font-semibold text-white leading-snug">
                  {toaccaQuestion.questionText}
                </p>

                {/* TOACCA PG / PGK Direct-Click Options */}
                {(toaccaQuestion.type === 'PG' || toaccaQuestion.type === 'PGK') &&
                  toaccaQuestion.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5">
                      {toaccaQuestion.options.map((opt) => {
                        const selected =
                          toaccaQuestion.type === 'PGK' && toaccaPGK.includes(opt.key);
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={submittingT}
                            onClick={() => handleToaccaOptionClick(toaccaQuestion, opt.key)}
                            className={`text-left flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] leading-snug transition-colors cursor-pointer disabled:opacity-60 ${
                              selected
                                ? 'bg-[#16A34A]/40 border-[#34D399] text-white font-semibold'
                                : 'bg-slate-900/90 border-white/12 text-slate-100 hover:bg-[#0A261F] hover:border-[#34D399]/70 active:bg-[#34D399]/25'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {selected && (
                              <Check className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                {/* TOACCA MENJODOHKAN Direct-Click Choices */}
                {toaccaQuestion.type === 'MENJODOHKAN' &&
                  toaccaQuestion.matchingChoices && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
                      {toaccaQuestion.matchingChoices.map((mc) => (
                        <button
                          key={mc.id}
                          type="button"
                          draggable
                          disabled={submittingT}
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', mc.text)}
                          onClick={() => void submitToaccaDirect(toaccaQuestion.id, mc.text)}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg border border-white/15 bg-slate-900/90 hover:bg-[#0A261F] hover:border-[#34D399] active:bg-[#34D399]/25 text-[11px] font-medium text-slate-100 transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <span>{mc.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                {/* TOACCA ISIAN SINGKAT Input */}
                {toaccaQuestion.type === 'ISIAN' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (toaccaText.trim()) {
                        void submitToaccaDirect(toaccaQuestion.id, toaccaText.trim());
                      }
                    }}
                    className="mt-1.5 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={toaccaText}
                        onChange={(e) => setToaccaText(e.target.value)}
                        placeholder="Ketik jawaban singkat Tim TOACCA..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#091C18] border border-[#34D399]/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#34D399]"
                      />
                      <button
                        type="submit"
                        disabled={submittingT || !toaccaText.trim()}
                        className="px-3 py-1.5 rounded-lg bg-[#34D399] hover:brightness-110 disabled:opacity-45 text-slate-950 font-semibold text-xs whitespace-nowrap cursor-pointer"
                      >
                        Jawab
                      </button>
                    </div>

                    {showToaccaPad && (
                      <div className="space-y-0.5 pt-0.5">
                        {MINI_KEY_ROWS.map((row, rIdx) => (
                          <div key={rIdx} className="flex flex-wrap gap-0.5">
                            {row.map((ch) => (
                              <button
                                key={ch}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setToaccaText((p) => p + ch)}
                                className="px-1.5 py-0.5 min-w-[20px] rounded bg-slate-900 hover:bg-slate-700 text-[10px] font-mono-num text-slate-200 border border-white/10 cursor-pointer"
                              >
                                {ch}
                              </button>
                            ))}
                            {rIdx === 2 && (
                              <>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => setToaccaText((p) => p + ' ')}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 border border-white/10 cursor-pointer"
                                >
                                  Spasi
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => setToaccaText('')}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 border border-white/10 cursor-pointer"
                                >
                                  Reset
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
