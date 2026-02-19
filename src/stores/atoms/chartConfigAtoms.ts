import { atom } from 'jotai';
import { DEFAULT_INTERVAL, DEFAULT_SYMBOL } from '../../constants/chart.constants';
import { Binance24hrStats } from '../../types';
import { currentPriceAtom } from './dataAtoms';

export const symbolAtom = atom(DEFAULT_SYMBOL);
export const intervalAtom = atom(DEFAULT_INTERVAL);

export const stats24hrAtom = atom<Binance24hrStats | null>(null);
export const wsConnectedAtom = atom(false);

export const chartStatsAtom = atom((get) => {
  const currentPrice = get(currentPriceAtom);
  const stats24hr = get(stats24hrAtom);

  if (currentPrice === null || !stats24hr) return null;

  const priceChange = parseFloat(stats24hr.priceChange);
  const priceChangePercent = parseFloat(stats24hr.priceChangePercent);

  return {
    currentPrice,
    priceChange,
    priceChangePercent,
    high: parseFloat(stats24hr.highPrice),
    low: parseFloat(stats24hr.lowPrice),
    volume: parseFloat(stats24hr.volume),
    isPositive: priceChange >= 0,
  };
});
