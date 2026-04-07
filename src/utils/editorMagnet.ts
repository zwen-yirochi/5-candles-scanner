import { CandleData } from '../types/candle.types';
import { ChartDomain } from '../types/domain.types';
import { ChartRange } from '../types/range.types';
import { indexToPixel, pixelToFloatIndex, priceToPixel } from './domainToRange';

export interface MagnetResult {
  x: number;      // 스냅된 픽셀 X (캔들 center)
  y: number;      // 스냅된 픽셀 Y
  index: number;  // 스냅된 캔들의 정수 인덱스
  price: number;  // 스냅된 OHLC 가격
}

export function snapToMagnet(
  pixelX: number,
  pixelY: number,
  candles: CandleData[],
  domain: ChartDomain,
  range: ChartRange,
  threshold: number = 20,
): MagnetResult | null {
  if (candles.length === 0) return null;

  // 1. 포인터에 가장 가까운 캔들 인덱스 결정
  const floatIndex  = pixelToFloatIndex(pixelX, domain.index, range);
  const candleIndex = Math.max(0, Math.min(candles.length - 1, Math.floor(floatIndex)));
  const candle      = candles[candleIndex];

  // 2. 캔들 center X 계산
  const candleWidth  = range.width / (domain.index.endIndex - domain.index.startIndex);
  const centerOffset = candleWidth * 0.5;
  const candleX      = indexToPixel(candleIndex, domain.index, range) + centerOffset;

  // 3. OHLC 각각 픽셀 Y와 포인터 거리 비교
  const ohlcPrices = [candle.open, candle.high, candle.low, candle.close];
  let bestDist  = Infinity;
  let bestPrice = 0;

  for (const price of ohlcPrices) {
    const py   = priceToPixel(price, domain.price, range);
    const dist = Math.hypot(pixelX - candleX, pixelY - py);
    if (dist < bestDist) {
      bestDist  = dist;
      bestPrice = price;
    }
  }

  if (bestDist > threshold) return null;

  return {
    x:     candleX,
    y:     priceToPixel(bestPrice, domain.price, range),
    index: candleIndex,
    price: bestPrice,
  };
}
