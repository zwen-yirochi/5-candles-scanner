// stores/atoms/patternAtoms.ts
import { atom } from 'jotai';
import { CandleData } from '../../types/candle.types';
import { PatternAnalyzer, TrendPattern } from '../../utils/patternAnalysis';
import { rawDataAtom } from './dataAtoms';
export type TimeFrame = '15m' | '30m' | '1h' | '4h';

// 각 타임프레임별 원시 데이터
export const timeframeDataAtom = atom<Record<TimeFrame, CandleData[]>>({
  '15m': [],
  '30m': [],
  '1h': [],
  '4h': [],
});

export const patternAnalysisAtom = atom<Record<TimeFrame, TrendPattern[]>>((get) => {
  const allData = get(timeframeDataAtom);

  const patterns: Record<TimeFrame, TrendPattern[]> = {
    '15m': [],
    '30m': [],
    '1h': [],
    '4h': [],
  };

  (Object.keys(allData) as TimeFrame[]).forEach((timeframe) => {
    const data = allData[timeframe];
    if (data.length > 0) {
      patterns[timeframe] = PatternAnalyzer.findValidConsecutiveTrends(data, 5);
    }
  });

  return patterns;
});

export const enabledPatternsAtom = atom<Record<TimeFrame, boolean>>({
  '15m': true,
  '30m': false,
  '1h': false,
  '4h': false,
});

// 현재 차트 타임프레임
export const currentChartTimeframeAtom = atom<TimeFrame>('15m');

export const activeDisplayPatternsAtom = atom((get) => {
  const allPatterns = get(patternAnalysisAtom);
  const enabled = get(enabledPatternsAtom);
  const timeframeData = get(timeframeDataAtom);
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
    if (!allPatterns[patternTimeframe]) return;

    const patternData = timeframeData[patternTimeframe];
    if (!patternData || patternData.length === 0) return;

    allPatterns[patternTimeframe].forEach((pattern) => {
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
