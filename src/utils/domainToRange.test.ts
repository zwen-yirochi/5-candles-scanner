import { pixelToPrice, timestampToIndex, indexToTimestamp } from './domainToRange';
import { CandleData } from '../types/candle.types';

const mockCandles: CandleData[] = [
  { timestamp: 1000, open: 100, high: 110, low: 90,  close: 105, volume: 1 },
  { timestamp: 2000, open: 105, high: 115, low: 95,  close: 110, volume: 1 },
  { timestamp: 3000, open: 110, high: 120, low: 100, close: 115, volume: 1 },
];

const priceDomain = { minPrice: 90, maxPrice: 120 };
const range = { width: 300, height: 300 };

describe('pixelToPrice', () => {
  it('상단(y=0)은 maxPrice를 반환한다', () => {
    expect(pixelToPrice(0, priceDomain, range)).toBeCloseTo(120);
  });

  it('하단(y=height)은 minPrice를 반환한다', () => {
    expect(pixelToPrice(300, priceDomain, range)).toBeCloseTo(90);
  });

  it('중앙(y=height/2)은 중간 가격을 반환한다', () => {
    expect(pixelToPrice(150, priceDomain, range)).toBeCloseTo(105);
  });
});

describe('timestampToIndex', () => {
  it('정확히 일치하는 timestamp는 해당 인덱스를 반환한다', () => {
    expect(timestampToIndex(2000, mockCandles)).toBe(1);
  });

  it('존재하지 않는 timestamp는 가장 가까운 인덱스를 반환한다', () => {
    expect(timestampToIndex(1400, mockCandles)).toBe(0);
    expect(timestampToIndex(1600, mockCandles)).toBe(1);
  });

  it('빈 배열은 0을 반환한다', () => {
    expect(timestampToIndex(1000, [])).toBe(0);
  });
});

describe('indexToTimestamp', () => {
  it('유효한 인덱스는 해당 timestamp를 반환한다', () => {
    expect(indexToTimestamp(1, mockCandles)).toBe(2000);
  });

  it('범위 초과 인덱스는 마지막 timestamp를 반환한다', () => {
    expect(indexToTimestamp(10, mockCandles)).toBe(3000);
  });

  it('빈 배열은 0을 반환한다', () => {
    expect(indexToTimestamp(0, [])).toBe(0);
  });
});
