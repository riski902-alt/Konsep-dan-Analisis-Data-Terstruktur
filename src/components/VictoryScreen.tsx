import React from 'react';
import { Award, Clock, Eye, Flag, Play, RotateCcw, Trophy } from 'lucide-react';
import type { RaceSessionState } from '../types/game';

interface VictoryScreenProps {
  session: RaceSessionState;
  inspectPodiumOnly: boolean;
  onToggleInspectPodium: () => void;
  onRematch: () => void;
  onBackToPreparation: () => void;
}

function formatTotalTime(startMs: number, endMs: number | null): string {
  const totalSec = Math.max(1, Math.round(((endMs ?? Date.now()) - startMs) / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs} detik`;
  return `${mins}m ${secs}d`;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  session,
  inspectPodiumOnly,
  onToggleInspectPodium,
  onRematch,
  onBackToPreparation,
}) => {
  const isLamaccaWin = session.winner === 'lamacca';
  const isToaccaWin = session.winner === 'toacca';
  const isDraw = session.winner === 'draw';

  const headline = isLamaccaWin
    ? 'SELAMAT! TIM LAMACCA MENJADI JUARA!'
    : isToaccaWin
      ? 'SELAMAT! TIM TOACCA MENJADI JUARA!'
      : 'LUAR BIASA! HASIL SERI — KEDUA TIM JUARA!';

  const appreciationQuote = isLamaccaWin
    ? "EWAKO! LAMACCA JUARA! TOACCA TETAP KEREN! TERUSKI' BELAJAR DAN BERJUANG!"
    : isToaccaWin
      ? "EWAKO! TOACCA JUARA! LAMACCA TETAP KEREN! TERUSKI' BELAJAR DAN BERJUANG!"
      : "SIPP MENTONG! LAMACCA DAN TOACCA SAMA-SAMA JUARA! TERUSKI' KOMPAK BELAJAR INFORMATIKA!";

  const winningBikeLabel = isLamaccaWin
    ? 'Motor Balap Biru — Tim LAMACCA'
    : isToaccaWin
      ? 'Motor Balap Hijau — Tim TOACCA'
      : 'Motor Biru & Motor Hijau (Juara Bersama)';

  if (inspectPodiumOnly) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={onToggleInspectPodium}
          className="px-4 py-2 rounded-xl bg-[#070D19]/92 border border-[#FBBF24]/60 text-[#FBBF24] font-display font-bold text-xs flex items-center gap-2 shadow-xl"
        >
          <Trophy className="w-4 h-4" />
          <span>Tampilkan Papan Hasil Juara</span>
        </button>
      </div>
    );
  }

  return (
    <section
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(1060px,95vw)] pointer-events-auto"
      aria-label="Halaman Kemenangan dan Piala 3D"
    >
      <div className="bg-[#070D19]/92 border border-[#FBBF24]/50 rounded-2xl p-3.5 md:p-4 shadow-[0_0_40px_rgba(251,191,36,0.16)] max-h-[44vh] overflow-y-auto racing-scroll">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2.5 border-b border-white/12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#FBBF24]">
              <Trophy className="w-3.5 h-3.5" />
              <span>PODIUM PIALA 3D · {winningBikeLabel}</span>
            </div>
            <h2 className="font-display font-bold text-lg md:text-2xl text-white tracking-tight">
              {headline}
            </h2>
            <p className="text-xs text-[#FDE68A] font-semibold">
              "{appreciationQuote}"
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 md:gap-0.5 shrink-0 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
              Waktu: <strong className="font-mono-num text-white">{formatTotalTime(session.raceStartedAtMs, session.raceFinishedAtMs)}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-[#34D399]" />
              Lintasan: <strong className="font-mono-num text-white">{session.totalSteps} Checkpoint</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2.5">
          {/* LAMACCA Card */}
          <div
            className={`rounded-xl px-3 py-2 border flex items-center justify-between gap-3 ${
              isLamaccaWin || isDraw
                ? 'bg-[#0B172A] border-[#FBBF24]'
                : 'bg-[#0B172A]/80 border-[#426A9B]/50'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {(isLamaccaWin || isDraw) && (
                  <Award className="w-4 h-4 text-[#FBBF24] shrink-0" />
                )}
                <h3 className="font-display font-bold text-sm text-white truncate">
                  LAMACCA — {session.lamacca.playerName}
                </h3>
              </div>
              <span className="text-[10px] text-[#38BDF8]">Motor Balap Biru</span>
            </div>

            <div className="flex items-center gap-3 text-center font-mono-num shrink-0">
              <div>
                <div className="text-[10px] text-slate-400">Langkah</div>
                <div className="text-sm font-bold text-[#38BDF8]">
                  {session.lamacca.steps}/{session.totalSteps}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Benar</div>
                <div className="text-sm font-bold text-emerald-400">
                  {session.lamacca.correctCount}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Salah</div>
                <div className="text-sm font-bold text-rose-400">
                  {session.lamacca.wrongCount}
                </div>
              </div>
            </div>
          </div>

          {/* TOACCA Card */}
          <div
            className={`rounded-xl px-3 py-2 border flex items-center justify-between gap-3 ${
              isToaccaWin || isDraw
                ? 'bg-[#091C18] border-[#FBBF24]'
                : 'bg-[#091C18]/80 border-[#16A34A]/50'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {(isToaccaWin || isDraw) && (
                  <Award className="w-4 h-4 text-[#FBBF24] shrink-0" />
                )}
                <h3 className="font-display font-bold text-sm text-white truncate">
                  TOACCA — {session.toacca.playerName}
                </h3>
              </div>
              <span className="text-[10px] text-[#34D399]">Motor Balap Hijau</span>
            </div>

            <div className="flex items-center gap-3 text-center font-mono-num shrink-0">
              <div>
                <div className="text-[10px] text-slate-400">Langkah</div>
                <div className="text-sm font-bold text-[#34D399]">
                  {session.toacca.steps}/{session.totalSteps}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Benar</div>
                <div className="text-sm font-bold text-emerald-400">
                  {session.toacca.correctCount}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Salah</div>
                <div className="text-sm font-bold text-rose-400">
                  {session.toacca.wrongCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onToggleInspectPodium}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-xs font-medium text-slate-200 flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>Piala 3D Penuh</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToPreparation}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Persiapan</span>
            </button>

            <button
              type="button"
              onClick={onRematch}
              className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:brightness-110 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Tanding Ulang</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
