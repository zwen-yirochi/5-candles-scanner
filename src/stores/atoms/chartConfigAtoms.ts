import { atom } from 'jotai';
import { CHART_DIMENSIONS, DEFAULT_INTERVAL, DEFAULT_SYMBOL } from '../../constants/chart.constants';

export const symbolAtom = atom(DEFAULT_SYMBOL);
export const intervalAtom = atom(DEFAULT_INTERVAL);

const INTERVAL_MS_MAP: Record<string, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '30m': 1_800_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
};

export const intervalMsAtom = atom((get) => {
  const interval = get(intervalAtom);
  return INTERVAL_MS_MAP[interval] ?? 3_600_000;
});

export const containerSizeAtom = atom({ width: 0, height: 0 });

export const chartDimensionsAtom = atom((get) => {
  const { width, height } = get(containerSizeAtom);
  const padding = 32;
  return {
    width: Math.max(0, width - padding - CHART_DIMENSIONS.AXIS_WIDTH),
    height: Math.max(0, height - padding - CHART_DIMENSIONS.AXIS_HEIGHT),
  };
});
