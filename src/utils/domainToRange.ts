import { CandleData } from '../types/candle.types';
import { ChartDomain, IndexDomain, PriceDomain } from '../types/domain.types';
import { ChartRange } from '../types/range.types';

export const indexToPixel = (index: number, domain: IndexDomain, range: ChartRange): number => {
  const normalized = (index - domain.startIndex) / (domain.endIndex - domain.startIndex);
  return normalized * range.width;
};

export const priceToPixel = (price: number, domain: PriceDomain, range: ChartRange): number => {
  const normalized = (price - domain.minPrice) / (domain.maxPrice - domain.minPrice);
  return range.height - normalized * range.height;
};

export const candleToPixels = (candle: CandleData, index: number, domain: ChartDomain, range: ChartRange) => {
  const x = indexToPixel(index, domain.index, range);
  const candleWidth = range.width / (domain.index.endIndex - domain.index.startIndex);

  const highY = priceToPixel(candle.high, domain.price, range);
  const lowY = priceToPixel(candle.low, domain.price, range);
  const openY = priceToPixel(candle.open, domain.price, range);
  const closeY = priceToPixel(candle.close, domain.price, range);

  return {
    x,
    candleWidth,
    highY,
    lowY,
    bodyY: Math.min(openY, closeY),
    bodyHeight: Math.abs(closeY - openY),
    wickHeight: lowY - highY,
  };
};

export const pixelToIndex = (pixelX: number, domain: IndexDomain, range: ChartRange): number => {
  const normalized = pixelX / range.width;
  return Math.floor(domain.startIndex + normalized * (domain.endIndex - domain.startIndex));
};

export const pixelToPrice = (
  pixelY: number,
  domain: PriceDomain,
  range: ChartRange,
): number => {
  const normalized = 1 - pixelY / range.height;
  return domain.minPrice + normalized * (domain.maxPrice - domain.minPrice);
};

export const timestampToIndex = (timestamp: number, candles: CandleData[]): number => {
  if (candles.length === 0) return 0;
  let closest = 0;
  let minDiff = Math.abs(candles[0].timestamp - timestamp);
  for (let i = 1; i < candles.length; i++) {
    const diff = Math.abs(candles[i].timestamp - timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closest = i;
    }
  }
  return closest;
};

export const indexToTimestamp = (index: number, candles: CandleData[]): number => {
  if (candles.length === 0) return 0;
  const clamped = Math.max(0, Math.min(candles.length - 1, index));
  return candles[clamped].timestamp;
};
