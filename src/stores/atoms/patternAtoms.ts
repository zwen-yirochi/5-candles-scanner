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

// 각 타임프레임별 패턴 분석 결과 (자동 계산 & 콘솔 출력)
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
            const detectedPatterns = PatternAnalyzer.findConsecutiveTrends(data, 5);
            patterns[timeframe] = detectedPatterns;

            // 콘솔에 패턴 출력
            if (detectedPatterns.length > 0) {
                console.log(`=== ${timeframe} 패턴 검출 결과 ===`);
                detectedPatterns.forEach((pattern, idx) => {
                    console.log(`패턴 ${idx + 1}:`, {
                        타입: pattern.type === 'bullish' ? '상승' : '하락',
                        시작인덱스: pattern.startIndex,
                        끝인덱스: pattern.endIndex,
                        연속길이: pattern.length,
                        시작시간: new Date(data[pattern.startIndex].timestamp).toLocaleString(),
                        종료시간: new Date(data[pattern.endIndex].timestamp).toLocaleString(),
                    });
                });
            }
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

// 현재 차트에 표시할 패턴들 (시간 기반 매핑)
export const activeDisplayPatternsAtom = atom((get) => {
    const allPatterns = get(patternAnalysisAtom);
    const enabled = get(enabledPatternsAtom);
    const timeframeData = get(timeframeDataAtom);
    const currentChartData = get(rawDataAtom); // 현재 차트 데이터
    const currentTimeframe = get(currentChartTimeframeAtom);

    if (currentChartData.length === 0) return [];

    const displayPatterns: Array<
        TrendPattern & {
            timeframe: TimeFrame;
            mappedStartIndex: number;
            mappedEndIndex: number;
        }
    > = [];

    (Object.keys(enabled) as TimeFrame[]).forEach((patternTimeframe) => {
        if (!enabled[patternTimeframe] || !allPatterns[patternTimeframe]) return;

        const patternData = timeframeData[patternTimeframe];
        if (!patternData || patternData.length === 0) return;

        allPatterns[patternTimeframe].forEach((pattern) => {
            // 패턴 시작/끝 시간
            const startTime = patternData[pattern.startIndex]?.timestamp;
            const endTime = patternData[pattern.endIndex]?.timestamp;

            if (!startTime || !endTime) return;

            // 현재 차트 데이터에서 해당 시간과 가장 가까운 인덱스 찾기
            const mappedStartIndex = findClosestTimeIndex(currentChartData, startTime);
            const mappedEndIndex = findClosestTimeIndex(currentChartData, endTime);

            if (mappedStartIndex !== -1 && mappedEndIndex !== -1) {
                displayPatterns.push({
                    ...pattern,
                    timeframe: patternTimeframe,
                    mappedStartIndex,
                    mappedEndIndex,
                });
            }
        });
    });

    return displayPatterns;
});

// 시간 기반 인덱스 찾기 함수
function findClosestTimeIndex(data: CandleData[], targetTime: number): number {
    if (data.length === 0) return -1;

    let closestIndex = 0;
    let minDiff = Math.abs(data[0].timestamp - targetTime);

    for (let i = 1; i < data.length; i++) {
        const diff = Math.abs(data[i].timestamp - targetTime);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
        // 시간이 정렬되어 있다면 더 이상 가까워지지 않을 때 중단
        if (data[i].timestamp > targetTime && diff > minDiff) {
            break;
        }
    }

    return closestIndex;
}
