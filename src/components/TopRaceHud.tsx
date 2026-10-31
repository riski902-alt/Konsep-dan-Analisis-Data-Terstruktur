import React, { useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Music,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  AudioSettings,
  CameraMode,
  RaceSessionState,
  RaceStatus,
} from '../types/game';

interface TopRaceHudProps {
  status: RaceStatus;
  session: RaceSessionState | null;
  elapsedSeconds: number;
  cameraMode: CameraMode;
  onChangeCamera: (mode: CameraMode) => void;
  audioSettings: AudioSettings;
  onChangeAudio: (next: AudioSettings) => void;
  hudCollapsed: boolean;
  onToggleCollapse: () => void;
  onResetToPrep: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const TopRaceHud: React.FC<TopRaceHudProps> = ({
  status,
  session,
  elapsedSeconds,
  cameraMode,
  onChangeCamera,
  audioSettings,
  onChangeAudio,
  hudCollapsed,
  onToggleCollapse,
  onResetToPrep,
}) => {
  const [audioOpen, setAudioOpen] = useState(false);

  const totalSteps = session?.totalSteps ?? 100;
  const lamaccaSteps = session?.lamacca.steps ?? 0;
  const toaccaSteps = session?.toacca.steps ?? 0;
  const lamaccaPct = Math.min(100, (lamaccaSteps / Math.max(1, totalSteps)) * 100);
  const toaccaPct = Math.min(100, (toaccaSteps / Math.max(1, totalSteps)) * 100);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none px-3 pt-2">
      <div className="max-w-[1380px] mx-auto">
        <div className="pointer-events-auto flex items-center justify-between gap-3 bg-[#070D19]/90 border border-white/12 rounded-lg px-3 py-1.5 shadow-md">
          {/* Zone 1: Brand Title & Timer */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-display font-bold text-sm md:text-base tracking-wider text-white whitespace-nowrap">
              LAMACCA <span className="text-[#FBBF24]">VS</span> TOACCA
            </span>
            {session && status !== 'preparing' && (
              <span className="hidden lg:inline-block text-[11px] text-slate-400 whitespace-nowrap">
                · Waktu <strong className="text-white font-mono-num">{formatDuration(elapsedSeconds)}</strong>
              </span>
            )}
          </div>

          {/* Zone 2: Independent Dual-Motor Track & Question Progress */}
          {status !== 'preparing' && session && (
            <div className="flex-1 max-w-2xl hidden sm:grid grid-cols-2 gap-3 px-2 items-center">
              {/* LAMACCA Inline Bar */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-display font-bold text-[#38BDF8] shrink-0">
                  LAMACCA
                </span>
                <div className="relative flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#426A9B] to-[#38BDF8] transition-transform duration-300 origin-left"
                    style={{ transform: `scaleX(${lamaccaPct / 100})` }}
                  />
                </div>
                <span className="text-[10px] font-mono-num text-[#38BDF8] font-semibold shrink-0">
                  {lamaccaSteps}/{totalSteps} · S{Math.min(session.totalQuestions, session.lamacca.currentIndex + 1)}
                </span>
              </div>

              {/* TOACCA Inline Bar */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-display font-bold text-[#34D399] shrink-0">
                  TOACCA
                </span>
                <div className="relative flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#16A34A] to-[#34D399] transition-transform duration-300 origin-left"
                    style={{ transform: `scaleX(${toaccaPct / 100})` }}
                  />
                </div>
                <span className="text-[10px] font-mono-num text-[#34D399] font-semibold shrink-0">
                  {toaccaSteps}/{totalSteps} · S{Math.min(session.totalQuestions, session.toacca.currentIndex + 1)}
                </span>
              </div>
            </div>
          )}

          {/* Zone 3: Slim Camera, Audio & Collapse Actions */}
          <div className="flex items-center gap-1.5 shrink-0 relative">
            {status === 'racing' && (
              <div className="hidden md:flex items-center gap-0.5 p-0.5 bg-slate-900 rounded-md border border-white/10">
                <Camera className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
                {(
                  [
                    { id: 'chase', label: 'Belakang' },
                    { id: 'side', label: 'Samping' },
                    { id: 'track', label: 'Lintasan' },
                  ] as const
                ).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onChangeCamera(cam.id)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                      cameraMode === cam.id
                        ? 'bg-[#0EA5E9] text-slate-950 font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                onChangeAudio({
                  ...audioSettings,
                  musicEnabled: !audioSettings.musicEnabled,
                })
              }
              title={audioSettings.musicEnabled ? 'Matikan Musik Latar' : 'Aktifkan Musik Latar'}
              className={`px-2 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1 transition-colors whitespace-nowrap ${
                audioSettings.musicEnabled && !audioSettings.muted
                  ? 'bg-slate-800/90 border-white/15 text-[#38BDF8]'
                  : 'bg-slate-900 border-white/10 text-slate-500'
              }`}
            >
              <Music className="w-3 h-3" />
              <span className="hidden xl:inline">Musik</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setAudioOpen((v) => !v)}
              className="px-2 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 border border-white/15 text-[11px] font-medium text-white flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              {audioSettings.muted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#34D399]" />
              )}
              <span className="hidden lg:inline">Suara</span>
            </button>

            {status === 'racing' && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onToggleCollapse}
                className="px-2 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 border border-white/15 text-[11px] font-medium text-slate-200 flex items-center gap-1 transition-colors whitespace-nowrap"
              >
                {hudCollapsed ? (
                  <>
                    <ChevronUp className="w-3 h-3 text-[#FBBF24]" />
                    <span>Soal</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                    <span className="hidden sm:inline">Arena</span>
                  </>
                )}
              </button>
            )}

            {status !== 'preparing' && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onResetToPrep}
                title="Kembali ke Persiapan"
                className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-white/10 text-[11px] font-medium text-slate-300 flex items-center gap-1 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden lg:inline">Menu</span>
              </button>
            )}

            {audioOpen && (
              <div className="absolute right-0 top-9 w-68 bg-[#0B132B] border border-white/15 rounded-xl p-3.5 shadow-2xl z-50 text-left">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
                  <span className="font-display font-semibold text-xs text-white">
                    Pengaturan Audio Balap
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeAudio({ ...audioSettings, muted: !audioSettings.muted })
                    }
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      audioSettings.muted
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {audioSettings.muted ? 'Unmute' : 'Mute'}
                  </button>
                </div>

                <div className="space-y-2.5 text-[11px]">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Volume Musik Latar</span>
                      <span className="font-mono-num">
                        {Math.round(audioSettings.musicVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(audioSettings.musicVolume * 100)}
                      onChange={(e) =>
                        onChangeAudio({
                          ...audioSettings,
                          musicVolume: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full accent-[#0EA5E9]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Volume Mesin Motor</span>
                      <span className="font-mono-num">
                        {Math.round(audioSettings.engineVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(audioSettings.engineVolume * 100)}
                      onChange={(e) =>
                        onChangeAudio({
                          ...audioSettings,
                          engineVolume: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full accent-[#34D399]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Volume Efek Suara</span>
                      <span className="font-mono-num">
                        {Math.round(audioSettings.sfxVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(audioSettings.sfxVolume * 100)}
                      onChange={(e) =>
                        onChangeAudio({
                          ...audioSettings,
                          sfxVolume: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full accent-[#FBBF24]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
