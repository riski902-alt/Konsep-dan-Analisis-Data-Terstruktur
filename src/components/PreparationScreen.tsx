import React from 'react';
import { FileText, Flag, Flame, Gauge, MousePointerClick, Play, Timer, Trophy } from 'lucide-react';
import { getLevelConfig } from '../config/levels';
import type { LeaderboardEntry } from '../types/game';

interface TopicOption {
  topicFilter: number;
  label: string;
  count: number;
}

interface PreparationScreenProps {
  lamaccaPlayer: string;
  toaccaPlayer: string;
  onChangeLamaccaPlayer: (val: string) => void;
  onChangeToaccaPlayer: (val: string) => void;
  topicFilter: number;
  onChangeTopicFilter: (val: number) => void;
  topics: TopicOption[];
  onStartRace: () => void;
  isStarting: boolean;
  leaderboard: LeaderboardEntry[];
}

export const PreparationScreen: React.FC<PreparationScreenProps> = ({
  lamaccaPlayer,
  toaccaPlayer,
  onChangeLamaccaPlayer,
  onChangeToaccaPlayer,
  topicFilter,
  onChangeTopicFilter,
  topics,
  onStartRace,
  isStarting,
  leaderboard,
}) => {
  const activeTopic = topics.find((t) => t.topicFilter === topicFilter) ?? {
    topicFilter: 0,
    label: 'Semua Level Beruntun: Level 1 s/d Level 5 (100 Soal)',
    count: 100,
  };

  const previewLevelCfg = getLevelConfig(topicFilter === 0 ? 1 : topicFilter);
  const trackMeters = activeTopic.count * previewLevelCfg.stepAdvanceMeters;

  return (
    <section
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(1180px,96vw)] pointer-events-auto"
      aria-label="Halaman Persiapan Balapan"
    >
      <div className="bg-[#070D19]/92 border border-white/14 rounded-2xl p-4 md:p-5 shadow-2xl max-h-[55vh] overflow-y-auto racing-scroll">
        {/* Compact Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <div>
            <h1 className="font-display font-bold text-lg md:text-2xl text-white tracking-tight flex items-center gap-2">
              <span>
                LAMACCA <span className="text-[#FBBF24]">VS</span> TOACCA
              </span>
              <span className="text-xs font-sans font-normal text-slate-400">
                · 3D Edu Racing Challenge (5 Level Adrenaline)
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 shrink-0">
            <span className="inline-flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-[#FBBF24]" />
              Soal: <strong className="font-mono-num text-white">{activeTopic.count}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="inline-flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-[#38BDF8]" />
              Lintasan: <strong className="font-mono-num text-white">{activeTopic.count} Checkpoint ({Math.round(trackMeters)} m)</strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <a
              href={`${import.meta.env.BASE_URL}assets/aistudio/Konsep_dan_Analisis_Data_Terstruktur_ee9558af.pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#38BDF8] hover:underline"
            >
              <FileText className="w-3 h-3" />
              <span>PDF Soal</span>
            </a>
          </div>
        </div>

        {/* Level Selector (5 Adrenaline Levels + All Levels Mode) */}
        <div className="mt-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
            {topics.map((tp) => {
              const selected = tp.topicFilter === topicFilter;
              const lvlCfg = tp.topicFilter >= 1 ? getLevelConfig(tp.topicFilter) : null;
              const shortLabel =
                tp.topicFilter === 0
                  ? 'Semua Level (1–5)'
                  : `Level ${tp.topicFilter} (20 Soal)`;
              const subAdrenaline =
                tp.topicFilter === 0
                  ? '100 Soal · Bertahap'
                  : `${lvlCfg?.adrenalineBadge ?? ''} · ${lvlCfg?.speedMultiplierLabel ?? ''}`;

              return (
                <button
                  key={tp.topicFilter}
                  type="button"
                  title={tp.label}
                  onClick={() => onChangeTopicFilter(tp.topicFilter)}
                  className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#0EA5E9]/20 border-[#38BDF8] text-white font-semibold'
                      : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <div className="truncate">{shortLabel}</div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      selected
                        ? lvlCfg
                          ? lvlCfg.uiTextClass
                          : 'text-[#38BDF8]'
                        : 'text-slate-400'
                    }`}
                  >
                    {subAdrenaline}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Level & Adrenaline Info Line */}
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
            <span className="truncate">
              Level aktif: <strong className="text-white">{activeTopic.label}</strong>
            </span>

            {topicFilter === 0 ? (
              <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px] text-amber-300 font-mono-num">
                <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Adrenaline Naik Tiap Level:</span>
                <span className="text-sky-300">Lv1 (30d · 1.0x)</span>
                <span className="text-slate-500">→</span>
                <span className="text-rose-300">Lv5 (13d · 2.3x)</span>
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-2 text-[11px] font-mono-num">
                <span className={`inline-flex items-center gap-1 font-semibold ${previewLevelCfg.uiTextClass}`}>
                  <Flame className="w-3.5 h-3.5" />
                  <span>{previewLevelCfg.adrenalineBadge}</span>
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-200">
                  Laju <strong className="text-white">{previewLevelCfg.speedMultiplierLabel}</strong>
                </span>
                <span className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1 text-slate-200">
                  <Timer className="w-3 h-3 text-[#FBBF24]" />
                  <span>Batas {previewLevelCfg.baseTimeLimitSec}d/soal</span>
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-200">{previewLevelCfg.bpmDisplay} BPM</span>
              </span>
            )}
          </div>
        </div>

        {/* Two Teams Compact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2.5 items-stretch">
          {/* TIM 1 — LAMACCA */}
          <div className="rounded-xl bg-[#0B172A] border border-[#426A9B]/60 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-[#38BDF8]">
                  TIM 1 — LAMACCA
                </span>
                <span className="text-[11px] text-slate-400">· Motor Biru (Jalur Kiri)</span>
              </div>
              <MousePointerClick className="w-4 h-4 text-[#38BDF8]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
              <input
                type="text"
                value={lamaccaPlayer}
                onChange={(e) => onChangeLamaccaPlayer(e.target.value)}
                placeholder="Nama pemain LAMACCA..."
                maxLength={30}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#070D19] border border-[#426A9B]/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
              />
              <div className="text-[11px] text-slate-300 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-white/5">
                Kotak Kiri Mandiri · <strong className="text-[#38BDF8]">Klik langsung</strong> pilihan jawaban!
              </div>
            </div>
          </div>

          {/* TIM 2 — TOACCA */}
          <div className="rounded-xl bg-[#091C18] border border-[#16A34A]/60 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-[#34D399]">
                  TIM 2 — TOACCA
                </span>
                <span className="text-[11px] text-slate-400">· Motor Hijau (Jalur Kanan)</span>
              </div>
              <MousePointerClick className="w-4 h-4 text-[#34D399]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
              <input
                type="text"
                value={toaccaPlayer}
                onChange={(e) => onChangeToaccaPlayer(e.target.value)}
                placeholder="Nama pemain TOACCA..."
                maxLength={30}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#070D19] border border-[#16A34A]/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#34D399]"
              />
              <div className="text-[11px] text-slate-300 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-white/5">
                Kotak Kanan Mandiri · <strong className="text-[#34D399]">Klik langsung</strong> pilihan jawaban!
              </div>
            </div>
          </div>
        </div>

        {/* Footer Start Bar */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-400">
            {leaderboard.length > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#FBBF24]" />
                Balapan terakhir:{' '}
                <strong className="text-white">
                  {leaderboard[0].winner === 'lamacca'
                    ? `LAMACCA (${leaderboard[0].lamaccaPlayer})`
                    : leaderboard[0].winner === 'toacca'
                      ? `TOACCA (${leaderboard[0].toaccaPlayer})`
                      : 'SERI'}
                </strong>{' '}
                · Skor {leaderboard[0].lamaccaSteps}-{leaderboard[0].toaccaSteps}
              </span>
            ) : (
              <span>
                Setiap naik Level, kecepatan motor, tempo sirkuit, & tekanan waktu Adrenaline makin menantang!
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isStarting}
            onClick={onStartRace}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#16A34A] hover:brightness-110 text-slate-950 font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{isStarting ? 'Menyiapkan Sirkuit...' : 'Mulai Permainan'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
