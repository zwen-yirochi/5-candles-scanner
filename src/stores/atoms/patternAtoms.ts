// stores/atoms/patternAtoms.ts
import { atom } from 'jotai';
import { CandleData } from '../../types/candle.types';
import { PatternAnalyzer, TrendPattern } from '../../utils/patternAnalysis';
import { rawDataAtom } from './dataAtoms';
export type TimeFrame = '15m' | '30m' | '1h' | '4h';

// 개별 타임프레임 데이터 atoms (독립적으로 업데이트 가능)
export const timeframeData15mAtom = atom<CandleData[]>([]);
export const timeframeData30mAtom = atom<CandleData[]>([]);
export const timeframeData1hAtom = atom<CandleData[]>([]);
export const timeframeData4hAtom = atom<CandleData[]>([]);

const timeframeAtomMap: Record<TimeFrame, typeof timeframeData15mAtom> = {
  '15m': timeframeData15mAtom,
  '30m': timeframeData30mAtom,
  '1h': timeframeData1hAtom,
  '4h': timeframeData4hAtom,
};

// 합성 read-write atom (기존 인터페이스 호환)
type TimeframeDataRecord = Record<TimeFrame, CandleData[]>;
export const timeframeDataAtom = atom(
  (get): TimeframeDataRecord => ({
    '15m': get(timeframeData15mAtom),
    '30m': get(timeframeData30mAtom),
    '1h': get(timeframeData1hAtom),
    '4h': get(timeframeData4hAtom),
  }),
  (
    get,
    set,
    update: TimeframeDataRecord | ((prev: TimeframeDataRecord) => TimeframeDataRecord)
  ) => {
    const newValue =
      typeof update === 'function'
        ? update({
            '15m': get(timeframeData15mAtom),
            '30m': get(timeframeData30mAtom),
            '1h': get(timeframeData1hAtom),
            '4h': get(timeframeData4hAtom),
          })
        : update;
    (Object.keys(newValue) as TimeFrame[]).forEach((tf) => {
      set(timeframeAtomMap[tf], newValue[tf]);
    });
  }
);

// 개별 타임프레임 패턴 atoms (해당 데이터 변경 시에만 재계산)
const patternAtom15m = atom((get) => {
  const data = get(timeframeData15mAtom);
  return data.length > 0 ? PatternAnalyzer.findValidConsecutiveTrends(data, 5) : [];
});
const patternAtom30m = atom((get) => {
  const data = get(timeframeData30mAtom);
  return data.length > 0 ? PatternAnalyzer.findValidConsecutiveTrends(data, 5) : [];
});
const patternAtom1h = atom((get) => {
  const data = get(timeframeData1hAtom);
  return data.length > 0 ? PatternAnalyzer.findValidConsecutiveTrends(data, 5) : [];
});
const patternAtom4h = atom((get) => {
  const data = get(timeframeData4hAtom);
  return data.length > 0 ? PatternAnalyzer.findValidConsecutiveTrends(data, 5) : [];
});

const patternAtomMap: Record<TimeFrame, typeof patternAtom15m> = {
  '15m': patternAtom15m,
  '30m': patternAtom30m,
  '1h': patternAtom1h,
  '4h': patternAtom4h,
};

// 합성 패턴 분석 atom (전체 읽기용)
export const patternAnalysisAtom = atom<Record<TimeFrame, TrendPattern[]>>((get) => ({
  '15m': get(patternAtom15m),
  '30m': get(patternAtom30m),
  '1h': get(patternAtom1h),
  '4h': get(patternAtom4h),
}));

export const enabledPatternsAtom = atom<Record<TimeFrame, boolean>>({
  '15m': true,
  '30m': false,
  '1h': false,
  '4h': false,
});

// 현재 차트 타임프레임
export const currentChartTimeframeAtom = atom<TimeFrame>('15m');

// 활성 패턴 표시 — 활성화된 타임프레임만 조건부 구독
export const activeDisplayPatternsAtom = atom((get) => {
  const enabled = get(enabledPatternsAtom);
  const currentChartData = get(rawDataAtom);

  if (currentChartData.length === 0) return [];

  const displayPatterns: Array<
    TrendPattern & {
      timeframe: TimeFrame;
      mappedStartIndex: number;
      mappedEndIndex: number;
    }
  > = [];

  (Object.keys(enabled) as TimeFrame[]).forEach((patternTimeframe) => {
    if (!enabled[patternTimeframe]) return;

    // 조건부 구독: 비활성화된 타임프레임은 get() 호출하지 않음
    const patterns = get(patternAtomMap[patternTimeframe]);
    const patternData = get(timeframeAtomMap[patternTimeframe]);
    if (!patternData || patternData.length === 0) return;

    patterns.forEach((pattern) => {
      const startTime = patternData[pattern.startIndex]?.timestamp;
      const endTime = patternData[pattern.endIndex]?.timestamp;

      if (!startTime || !endTime) return;

      displayPatterns.push({
        ...pattern,
        timeframe: patternTimeframe,
        mappedStartIndex: pattern.startIndex,
        mappedEndIndex: pattern.endIndex,
      });
    });
  });

  return displayPatterns;
});
