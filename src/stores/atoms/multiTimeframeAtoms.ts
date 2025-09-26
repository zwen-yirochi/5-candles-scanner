// stores/atoms/multiTimeframeAtoms.ts
import { atom } from 'jotai';

import { CandleData } from '../../types/candle.types';
import { PatternAnalyzer, TrendPattern } from '../../utils/patternAnalysis';
import { TimeFrame } from '../../utils/timeframeColors';

// 각 타임프레임별 원시 데이터
export const timeframeDataAtom = atom<Record<TimeFrame, CandleData[]>>({
    '15m': [],
    '30m': [],
    '1h': [],
    '4h': [],
});

// 각 타임프레임별 패턴 (자동 계산)
export const timeframePatternsAtom = atom<Record<TimeFrame, TrendPattern[]>>((get) => {
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
            patterns[timeframe] = PatternAnalyzer.findConsecutiveTrends(data, 5);
        }
    });

    return patterns;
});

// 현재 메인 차트에 표시할 타임프레임
export const currentDisplayTimeframeAtom = atom<TimeFrame>('15m');

// 현재 표시 중인 타임프레임의 데이터
export const currentDisplayDataAtom = atom((get) => {
    const allData = get(timeframeDataAtom);
    const currentTimeframe = get(currentDisplayTimeframeAtom);
    return allData[currentTimeframe];
});

// 패턴 표시 활성화 상태
export const enabledPatternsAtom = atom<Record<TimeFrame, boolean>>({
    '15m': true,
    '30m': false,
    '1h': false,
    '4h': false,
});

// 현재 활성화된 모든 패턴들 (표시용)
export const activeDisplayPatternsAtom = atom((get) => {
    const allPatterns = get(timeframePatternsAtom);
    const enabled = get(enabledPatternsAtom);
    const currentDisplayTimeframe = get(currentDisplayTimeframeAtom);
    const currentDisplayData = get(currentDisplayDataAtom);

    const displayPatterns: Array<TrendPattern & { timeframe: TimeFrame }> = [];

    (Object.keys(enabled) as TimeFrame[]).forEach((timeframe) => {
        if (enabled[timeframe] && allPatterns[timeframe]) {
            // 현재 표시 중인 타임프레임에 맞춰 인덱스 변환
            allPatterns[timeframe].forEach((pattern) => {
                // TODO: 다른 타임프레임의 패턴을 현재 표시 타임프레임으로 매핑하는 로직 필요
                displayPatterns.push({ ...pattern, timeframe });
            });
        }
    });

    return displayPatterns;
});
