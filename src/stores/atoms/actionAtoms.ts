import { atom } from 'jotai';
import { CandleData } from '../../types/candle.types';
import { rawDataAtom, visibleDataAtom } from './dataAtoms';
import { indexDomainAtom, priceDomainAtom } from './domainAtoms';
import { chartRangeAtom } from './rangeAtoms';

const CONFIG = {
  DEFAULT_VISIBLE_COUNT: 50,
  INITIAL_FUTURE_BUFFER: 5, // 초기 미래 여백
  MAX_FUTURE_BUFFER: 50, // 최대 미래 여백 (무한 확장 방지)
  MIN_ZOOM_RANGE: 10,
  PRICE_PADDING: 0.1,
} as const;

type InitParams = {
  data: CandleData[];
  width: number;
  height: number;
};

function calculatePriceDomain(data: CandleData[]) {
  if (data.length === 0) return null;

  const prices = data.flatMap((d) => [d.open, d.high, d.low, d.close]);
  if (prices.length === 0) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * CONFIG.PRICE_PADDING;

  return {
    minPrice: min - padding,
    maxPrice: max + padding,
  };
}

// 초기화
export const initializeChartAtom = atom(null, (get, set, { data, width, height }: InitParams) => {
  if (data.length === 0) return;

  set(rawDataAtom, data);
  set(chartRangeAtom, { width, height });

  const displayCount = Math.min(CONFIG.DEFAULT_VISIBLE_COUNT, data.length);

  // 논리적 인덱스 (미래 여백 포함)
  const endIndex = data.length - 1 + CONFIG.INITIAL_FUTURE_BUFFER;
  const startIndex = Math.max(0, endIndex - displayCount + 1);

  set(indexDomainAtom, { startIndex, endIndex });

  // Y축 계산은 실제 데이터만 사용
  const actualEnd = Math.min(endIndex, data.length - 1);
  const visibleData = data.slice(startIndex, actualEnd + 1);

  const priceDomain = calculatePriceDomain(visibleData);
  if (priceDomain) set(priceDomainAtom, priceDomain);
});

// X축 패닝
export const panXAtom = atom(null, (get, set, delta: number) => {
  const domain = get(indexDomainAtom);
  const dataLength = get(rawDataAtom).length;
  const range = domain.endIndex - domain.startIndex;

  let newStart = domain.startIndex + delta;
  let newEnd = domain.endIndex + delta;

  if (newStart < 0) {
    newStart = 0;
    newEnd = range;
  }

  const maxEnd = dataLength - 1 + CONFIG.MAX_FUTURE_BUFFER;
  if (newEnd > maxEnd) {
    newEnd = maxEnd;
    newStart = Math.max(0, newEnd - range);
  }

  set(indexDomainAtom, { startIndex: newStart, endIndex: newEnd });
});

// X축 줌
export const zoomXAtom = atom(null, (get, set, factor: number) => {
  const domain = get(indexDomainAtom);
  const dataLength = get(rawDataAtom).length;

  const center = (domain.startIndex + domain.endIndex) / 2;
  const currentRange = domain.endIndex - domain.startIndex;
  const newRange = currentRange * factor;

  // 범위 검증
  if (newRange < CONFIG.MIN_ZOOM_RANGE) return;
  if (newRange > dataLength + CONFIG.MAX_FUTURE_BUFFER) return;

  let startIndex = center - newRange / 2;
  let endIndex = center + newRange / 2;

  // 왼쪽 경계
  if (startIndex < 0) {
    startIndex = 0;
    endIndex = newRange;
  }

  // 오른쪽 경계
  const maxEnd = dataLength - 1 + CONFIG.MAX_FUTURE_BUFFER;
  if (endIndex > maxEnd) {
    endIndex = maxEnd;
    startIndex = Math.max(0, endIndex - newRange);
  }

  set(indexDomainAtom, {
    startIndex: Math.max(0, Math.round(startIndex)),
    endIndex: Math.min(dataLength - 1, Math.round(endIndex)),
  });
});

// Y축 자동 맞춤 (실제 표시되는 데이터 기준)
export const autoFitYAtom = atom(null, (get, set) => {
  const visibleData = get(visibleDataAtom); // 이미 안전하게 계산됨
  const priceDomain = calculatePriceDomain(visibleData);

  if (priceDomain) {
    set(priceDomainAtom, priceDomain);
  }
});
