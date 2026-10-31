import React from 'react';
import { Flame, Gauge, Timer, Zap } from 'lucide-react';
import { getLevelConfig } from '../config/levels';

interface LevelBannerOverlayProps {
  level: number | null;
  triggeredByTeam?: string | null;
}

export const LevelBannerOverlay: React.FC<LevelBannerOverlayProps> = ({
  level,
  triggeredByTeam,
}) => {
  if (level === null) return null;

  const cfg = getLevelConfig(level);

  return (
    <div
      className="fixed inset-x-0 top-13 z-40 flex justify-center px-3 pointer-events-none select-none"
      role="status"
      aria-live="polite"
    >
      <div
        className={`w-[min(760px,95vw)] rounded-2xl ${cfg.uiBgClass} border-2 ${cfg.uiBorderClass} px-5 py-3 shadow-2xl text-center`}
      >
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono-num uppercase tracking-wider">
          <span className={`inline-flex items-center gap-1 font-bold ${cfg.uiTextClass}`}>
            <Flame className="w-3.5 h-3.5" />
            <span>{cfg.adrenalineBadge}</span>
          </span>
          <span className="text-slate-500">·</span>
          <span className="inline-flex items-center gap-1 text-white">
            <Zap className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>{cfg.adrenalineTitle}</span>
          </span>
          {triggeredByTeam && (
            <>
              <span className="text-slate-500">·</span>
              <span className="text-slate-200">{triggeredByTeam}</span>
            </>
          )}
        </div>

        <h2 className="font-display font-bold text-2xl md:text-4xl text-white tracking-wider mt-0.5">
          MEMASUKI LEVEL {cfg.level}
        </h2>

        <p className="text-xs md:text-sm font-semibold text-slate-100 mt-0.5">
          {cfg.materialTitle}
        </p>

        <p className={`text-[11px] mt-0.5 ${cfg.uiTextClass}`}>
          {cfg.announcementDesc}
        </p>

        <div className="mt-2 pt-1.5 border-t border-white/15 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono-num text-slate-200">
          <span className="inline-flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-[#38BDF8]" />
            Laju Sirkuit: <strong className="text-white">{cfg.speedMultiplierLabel}</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <Timer className="w-3.5 h-3.5 text-[#FBBF24]" />
            Batas Waktu Soal: <strong className="text-white">{cfg.baseTimeLimitSec} dtk</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            Tempo Musik: <strong className="text-white">{cfg.bpmDisplay} BPM</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
