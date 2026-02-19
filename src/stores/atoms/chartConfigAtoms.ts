import { atom } from 'jotai';
import { CHART_DIMENSIONS, DEFAULT_INTERVAL, DEFAULT_SYMBOL } from '../../constants/chart.constants';

export const symbolAtom = atom(DEFAULT_SYMBOL);
export const intervalAtom = atom(DEFAULT_INTERVAL);

export const containerSizeAtom = atom({ width: 0, height: 0 });

export const chartDimensionsAtom = atom((get) => {
  const { width, height } = get(containerSizeAtom);
  const padding = 32;
  return {
    width: Math.max(0, width - padding - CHART_DIMENSIONS.AXIS_WIDTH),
    height: Math.max(0, height - padding - CHART_DIMENSIONS.AXIS_HEIGHT),
  };
});
