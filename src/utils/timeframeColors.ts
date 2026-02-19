import { PatternTimeFrame } from '../types/pattern.types';

export type TimeFrame = PatternTimeFrame;

export interface ZoneColors {
  bg: string; // 활성 배경
  border: string; // 활성 테두리
  bgBroken: string; // 돌파 배경
  label: string; // TF 라벨 색상
}

// 회색 계열 — 높은 TF일수록 진하게
export const ZONE_COLORS: Record<TimeFrame, ZoneColors> = {
  '15m': {
    bg: 'rgba(120,120,120, 0.10)',
    border: 'rgba(120,120,120, 0.30)',
    bgBroken: 'rgba(120,120,120, 0.05)',
    label: 'rgba(120,120,120, 0.35)',
  },
  '30m': {
    bg: 'rgba(100,100,100, 0.14)',
    border: 'rgba(100,100,100, 0.40)',
    bgBroken: 'rgba(100,100,100, 0.07)',
    label: 'rgba(100,100,100, 0.45)',
  },
  '1h': {
    bg: 'rgba(80,80,80, 0.18)',
    border: 'rgba(80,80,80, 0.50)',
    bgBroken: 'rgba(80,80,80, 0.09)',
    label: 'rgba(80,80,80, 0.55)',
  },
  '4h': {
    bg: 'rgba(60,60,60, 0.22)',
    border: 'rgba(60,60,60, 0.65)',
    bgBroken: 'rgba(60,60,60, 0.12)',
    label: 'rgba(60,60,60, 0.70)',
  },
};

export const TIMEFRAME_LABELS: Record<TimeFrame, string> = {
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
};
