import type { QuestionType } from '../types/game.ts';

export interface LevelAdrenalineConfig {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  shortLabel: string;
  materialTitle: string;
  adrenalineTitle: string;
  adrenalineBadge: string;
  speedMultiplierLabel: string;
  baseTimeLimitSec: number;
  cruiseSpeedMps: number;
  stepAdvanceMeters: number;
  musicStepMs: number;
  bpmDisplay: number;
  engineCruiseHz: number;
  uiAccentHex: string;
  uiBgClass: string;
  uiBorderClass: string;
  uiTextClass: string;
  skyHex: number;
  rimLightHex: number;
  streakHex: number;
  announcementDesc: string;
}

export const LEVEL_CONFIGS: Record<1 | 2 | 3 | 4 | 5, LevelAdrenalineConfig> = {
  1: {
    level: 1,
    label: 'Level 1: Konsep Dasar Data: Data Terstruktur vs. Tidak Terstruktur (20 Soal)',
    shortLabel: 'Level 1',
    materialTitle: 'Konsep Dasar Data: Data Terstruktur vs. Tidak Terstruktur',
    adrenalineTitle: 'WARM-UP CIRCUIT',
    adrenalineBadge: 'Adrenaline Normal',
    speedMultiplierLabel: '1.0x',
    baseTimeLimitSec: 30,
    cruiseSpeedMps: 4.2,
    stepAdvanceMeters: 10.5,
    musicStepMs: 122,
    bpmDisplay: 123,
    engineCruiseHz: 72,
    uiAccentHex: '#38BDF8',
    uiBgClass: 'bg-sky-950/85',
    uiBorderClass: 'border-sky-400/70',
    uiTextClass: 'text-sky-300',
    skyHex: 0x070d19,
    rimLightHex: 0x38bdf8,
    streakHex: 0x7dd3fc,
    announcementDesc: 'Sirkuit Pemanasan — Fokus pahami dasar data & bangun ritme kecepatan awal!',
  },
  2: {
    level: 2,
    label: 'Level 2: Pengidentifikasian dan Pemodelan Data Terstruktur (20 Soal)',
    shortLabel: 'Level 2',
    materialTitle: 'Pengidentifikasian dan Pemodelan Data Terstruktur',
    adrenalineTitle: 'HIGH-SPEED PURSUIT',
    adrenalineBadge: 'Adrenaline Meningkat',
    speedMultiplierLabel: '1.3x',
    baseTimeLimitSec: 25,
    cruiseSpeedMps: 5.5,
    stepAdvanceMeters: 12.0,
    musicStepMs: 110,
    bpmDisplay: 136,
    engineCruiseHz: 84,
    uiAccentHex: '#34D399',
    uiBgClass: 'bg-emerald-950/85',
    uiBorderClass: 'border-emerald-400/70',
    uiTextClass: 'text-emerald-300',
    skyHex: 0x081326,
    rimLightHex: 0x2dd4bf,
    streakHex: 0x6ee7b7,
    announcementDesc: 'Kecepatan Meningkat! Waktu berpikir makin singkat & mesin mulai memanas!',
  },
  3: {
    level: 3,
    label: 'Level 3: Antarmuka dan Elemen Dasar Lembar Kerja Pengolah Data (20 Soal)',
    shortLabel: 'Level 3',
    materialTitle: 'Antarmuka dan Elemen Dasar Lembar Kerja Pengolah Data',
    adrenalineTitle: 'TURBO NIGHT RUSH',
    adrenalineBadge: 'Adrenaline Tinggi',
    speedMultiplierLabel: '1.6x',
    baseTimeLimitSec: 20,
    cruiseSpeedMps: 6.9,
    stepAdvanceMeters: 13.5,
    musicStepMs: 99,
    bpmDisplay: 151,
    engineCruiseHz: 96,
    uiAccentHex: '#FBBF24',
    uiBgClass: 'bg-amber-950/85',
    uiBorderClass: 'border-amber-400/75',
    uiTextClass: 'text-amber-300',
    skyHex: 0x160d1c,
    rimLightHex: 0xfbbf24,
    streakHex: 0xfde047,
    announcementDesc: 'Adrenaline Tinggi! Deru turbo makin kencang — ambil keputusan cepat & tepat!',
  },
  4: {
    level: 4,
    label: 'Level 4: Pengolahan dan Pengorganisasian Data (20 Soal)',
    shortLabel: 'Level 4',
    materialTitle: 'Pengolahan dan Pengorganisasian Data',
    adrenalineTitle: 'EXTREME OVERDRIVE',
    adrenalineBadge: 'Adrenaline Ekstrem',
    speedMultiplierLabel: '1.9x',
    baseTimeLimitSec: 16,
    cruiseSpeedMps: 8.5,
    stepAdvanceMeters: 15.2,
    musicStepMs: 90,
    bpmDisplay: 166,
    engineCruiseHz: 110,
    uiAccentHex: '#FB923C',
    uiBgClass: 'bg-orange-950/90',
    uiBorderClass: 'border-orange-400/80',
    uiTextClass: 'text-orange-300',
    skyHex: 0x1d0914,
    rimLightHex: 0xf97316,
    streakHex: 0xfdba74,
    announcementDesc: 'Zona Overdrive Ekstrem! Tekanan waktu ketat & lintasan berkecepatan tinggi!',
  },
  5: {
    level: 5,
    label: 'Level 5: Praktik Analisis dan Pengolahan Data Sederhana (20 Soal)',
    shortLabel: 'Level 5',
    materialTitle: 'Praktik Analisis dan Pengolahan Data Sederhana',
    adrenalineTitle: 'FINAL APEX SHOWDOWN',
    adrenalineBadge: 'Adrenaline Maksimal',
    speedMultiplierLabel: '2.3x',
    baseTimeLimitSec: 13,
    cruiseSpeedMps: 10.4,
    stepAdvanceMeters: 17.2,
    musicStepMs: 82,
    bpmDisplay: 182,
    engineCruiseHz: 125,
    uiAccentHex: '#F43F5E',
    uiBgClass: 'bg-rose-950/90',
    uiBorderClass: 'border-rose-400/85',
    uiTextClass: 'text-rose-300',
    skyHex: 0x22060c,
    rimLightHex: 0xf43f5e,
    streakHex: 0xfda4af,
    announcementDesc: 'PUNCAK ADRENALINE MAKSIMAL! Kecepatan penuh menuju garis finis juara!',
  },
};

export function getLevelConfig(rawLevel: number): LevelAdrenalineConfig {
  const clamped = Math.min(5, Math.max(1, Math.round(rawLevel))) as 1 | 2 | 3 | 4 | 5;
  return LEVEL_CONFIGS[clamped];
}

export function getQuestionTimeLimitSec(level: number, qType: QuestionType): number {
  const cfg = getLevelConfig(level);
  if (qType === 'ISIAN' || qType === 'PGK') {
    return cfg.baseTimeLimitSec + 6;
  }
  return cfg.baseTimeLimitSec;
}
