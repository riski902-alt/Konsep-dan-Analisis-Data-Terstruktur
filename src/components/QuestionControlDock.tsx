import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Flag,
  Keyboard,
  Link2,
  XCircle,
} from 'lucide-react';
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

  // Per-team anti-double-click guard (280ms) so fast clicks don't accidentally hit the newly arrived question
  const lastSubmitLamaccaMs = useRef<number>(0);
  const lastSubmitToaccaMs = useRef<number>(0);

  // Reset ONLY LAMACCA's draft when LAMACCA advances to their next question
  useEffect(() => {
    setLamaccaPGK([]);
    setLamaccaText('');
    setSubmittingL(false);
  }, [lamaccaQuestion?.id]);

  // Reset ONLY TOACCA's draft when TOACCA advances to their next question
  useEffect(() => {
    setToaccaPGK([]);
    setToaccaText('');
    setSubmittingT(false);
  }, [toaccaQuestion?.id]);

  const submitLamaccaDirect = useCallback(
    async (questionId: string, payload: unknown) => {
      if (session.lamacca.completedAllQuestions || submittingL) return;
      if (Date.now() - lastSubmitLamaccaMs.current < 280) return;

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
      if (Date.now() - lastSubmitToaccaMs.current < 280) return;

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

  const handleLamaccaOptionClick = (q: PublicQuestion, optKey: 'A' | 'B' | 'C' | 'D') => {
    if (q.type === 'PG') {
      void submitLamaccaDirect(q.id, optKey);
      return;
    }

    // PGK: toggle option; automatically submit as soon as requiredCount options are selected
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

    // PGK: toggle option; automatically submit as soon as requiredCount options are selected
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
          className={`rounded-xl bg-[#070D19]/92 border px-3 py-2 shadow-2xl max-h-[39vh] overflow-y-auto racing-scroll flex flex-col justify-between transition-colors ${
            dragOverTeam === 'lamacca'
              ? 'border-[#38BDF8] bg-[#0B172A]/95'
              : 'border-[#426A9B]/75'
          }`}
        >
          <div>
            {/* LAMACCA Header */}
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-display font-bold text-xs text-[#38BDF8] whitespace-nowrap">
                  TIM LAMACCA
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  · {session.lamacca.playerName}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono-num">
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

            {/* Instant Makassar–Sinjai Feedback Strip (Non-Blocking) */}
            {session.lamacca.lastFeedback && (
              <div
                className={`mt-1.5 rounded px-2 py-1 border flex items-center gap-1.5 text-[11px] leading-tight ${
                  session.lamacca.lastFeedback.isCorrect
                    ? 'bg-emerald-950/65 border-emerald-400/40 text-emerald-100'
                    : 'bg-rose-950/65 border-rose-400/40 text-rose-100'
                }`}
              >
                {session.lamacca.lastFeedback.isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
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
                  SELURUH SOAL TIM LAMACCA SELESAI!
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
              <div className="mt-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 mb-1">
                  <span className="truncate max-w-[82%]">
                    <span className="text-[#38BDF8]">{lamaccaQuestion.topicTitle}</span> ·{' '}
                    <span className="text-[#FBBF24] font-semibold">
                      {lamaccaQuestion.categoryTitle}
                    </span>
                    {lamaccaQuestion.categoryNote && (
                      <span className="text-slate-300 ml-1">{lamaccaQuestion.categoryNote}</span>
                    )}
                  </span>

                  {lamaccaQuestion.type === 'PGK' && (
                    <span className="px-1.5 py-0.5 rounded bg-[#0B172A] border border-[#38BDF8]/40 text-[#38BDF8] font-mono-num text-[10px]">
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

                {/* LAMACCA PG / PGK Direct-Click Options (No ASDF badges, auto-reads on click) */}
                {(lamaccaQuestion.type === 'PG' || lamaccaQuestion.type === 'PGK') &&
                  lamaccaQuestion.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
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

                {/* LAMACCA MENJODOHKAN Direct-Click Choices (No ASDF badges, auto-reads on click) */}
                {lamaccaQuestion.type === 'MENJODOHKAN' &&
                  lamaccaQuestion.matchingChoices && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
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

                {/* LAMACCA ISIAN SINGKAT Input (Only shown on Type D Isian Singkat) */}
                {lamaccaQuestion.type === 'ISIAN' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (lamaccaText.trim()) {
                        void submitLamaccaDirect(lamaccaQuestion.id, lamaccaText.trim());
                      }
                    }}
                    className="mt-2 space-y-1.5"
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
          className={`rounded-xl bg-[#070D19]/92 border px-3 py-2 shadow-2xl max-h-[39vh] overflow-y-auto racing-scroll flex flex-col justify-between transition-colors ${
            dragOverTeam === 'toacca'
              ? 'border-[#34D399] bg-[#091C18]/95'
              : 'border-[#16A34A]/75'
          }`}
        >
          <div>
            {/* TOACCA Header */}
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-display font-bold text-xs text-[#34D399] whitespace-nowrap">
                  TIM TOACCA
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  · {session.toacca.playerName}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono-num">
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

            {/* Instant Makassar–Sinjai Feedback Strip (Non-Blocking) */}
            {session.toacca.lastFeedback && (
              <div
                className={`mt-1.5 rounded px-2 py-1 border flex items-center gap-1.5 text-[11px] leading-tight ${
                  session.toacca.lastFeedback.isCorrect
                    ? 'bg-emerald-950/65 border-emerald-400/40 text-emerald-100'
                    : 'bg-rose-950/65 border-rose-400/40 text-rose-100'
                }`}
              >
                {session.toacca.lastFeedback.isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
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
                  SELURUH SOAL TIM TOACCA SELESAI!
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
              <div className="mt-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 mb-1">
                  <span className="truncate max-w-[82%]">
                    <span className="text-[#34D399]">{toaccaQuestion.topicTitle}</span> ·{' '}
                    <span className="text-[#FBBF24] font-semibold">
                      {toaccaQuestion.categoryTitle}
                    </span>
                    {toaccaQuestion.categoryNote && (
                      <span className="text-slate-300 ml-1">{toaccaQuestion.categoryNote}</span>
                    )}
                  </span>

                  {toaccaQuestion.type === 'PGK' && (
                    <span className="px-1.5 py-0.5 rounded bg-[#091C18] border border-[#34D399]/40 text-[#34D399] font-mono-num text-[10px]">
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

                {/* TOACCA PG / PGK Direct-Click Options (No JKL; badges, auto-reads on click) */}
                {(toaccaQuestion.type === 'PG' || toaccaQuestion.type === 'PGK') &&
                  toaccaQuestion.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
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

                {/* TOACCA MENJODOHKAN Direct-Click Choices (No JKL; badges, auto-reads on click) */}
                {toaccaQuestion.type === 'MENJODOHKAN' &&
                  toaccaQuestion.matchingChoices && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
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

                {/* TOACCA ISIAN SINGKAT Input (Only shown on Type D Isian Singkat) */}
                {toaccaQuestion.type === 'ISIAN' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (toaccaText.trim()) {
                        void submitToaccaDirect(toaccaQuestion.id, toaccaText.trim());
                      }
                    }}
                    className="mt-2 space-y-1.5"
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
