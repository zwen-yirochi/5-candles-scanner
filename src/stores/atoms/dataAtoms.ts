import { atom } from 'jotai';
import { Binance24hrStats, IndexDomain } from '../../types';
import { CandleData } from '../../types/candle.types';
import { indexDomainAtom } from './domainAtoms';

export const rawDataAtom = atom<CandleData[]>([]);

export const hasDataAtom = atom((get) => get(rawDataAtom).length > 0);

export const baseTimestampAtom = atom((get) => {
    const data = get(rawDataAtom);
    return data.length > 0 ? data[0].timestamp : null;
});

export const currentPriceAtom = atom((get) => {
    const data = get(rawDataAtom);
    return data.length > 0 ? data[data.length - 1].close : null;
});

export const visibleDataAtom = atom((get) => {
    const data = get(rawDataAtom);
    const { startIndex, endIndex }: IndexDomain = get(indexDomainAtom);

    if (data.length === 0) return [];

    const safeStart = Math.max(0, Math.floor(startIndex));
    const safeEnd = Math.min(data.length - 1, Math.floor(endIndex));

    if (safeStart > safeEnd) return [];

    return data.slice(safeStart, safeEnd + 1);
});

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
