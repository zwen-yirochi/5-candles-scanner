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
            // 유효한 패턴만 가져오기 (돌파되지 않은 패턴)
            const validPatterns = PatternAnalyzer.findValidConsecutiveTrends(data, 5);
            patterns[timeframe] = validPatterns;

            // 콘솔 출력
            if (validPatterns.length > 0) {
                console.log(`=== ${timeframe} 유효 패턴 검출 결과 ===`);
                validPatterns.forEach((pattern, idx) => {
                    console.log(`패턴 ${idx + 1}:`, {
                        타입: pattern.type === 'bullish' ? '상승' : '하락',
                        시작인덱스: pattern.startIndex,
                        끝인덱스: pattern.endIndex,
                        연속길이: pattern.length,
                        시작시간: new Date(data[pattern.startIndex].timestamp).toLocaleString(),
                        종료시간: new Date(data[pattern.endIndex].timestamp).toLocaleString(),
                        상태: '유효 (돌파되지 않음)',
                    });
                });
            }

            // 돌파된 패턴도 로그로 확인
            const allPatterns = PatternAnalyzer.findConsecutiveTrends(data, 5);
            const brokenPatterns = allPatterns.filter((p) => PatternAnalyzer.isPatternBroken(data, p));
            if (brokenPatterns.length > 0) {
                console.log(`=== ${timeframe} 돌파된 패턴 (제외됨) ===`);
                brokenPatterns.forEach((pattern, idx) => {
                    console.log(`돌파된 패턴 ${idx + 1}:`, {
                        타입: pattern.type === 'bullish' ? '상승' : '하락',
                        연속길이: pattern.length,
                        상태: '돌파됨 (표시 안함)',
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
// stores/atoms/patternAtoms.ts - activeDisplayPatternsAtom 수정

export const activeDisplayPatternsAtom = atom((get) => {
    const allPatterns = get(patternAnalysisAtom);
    const enabled = get(enabledPatternsAtom);
    const timeframeData = get(timeframeDataAtom);
    const currentChartData = get(rawDataAtom);

    console.log('activeDisplayPatternsAtom 실행:', {
        enabled,
        allPatternsCount: Object.values(allPatterns).flat().length,
        currentChartDataLength: currentChartData.length,
    });

    if (currentChartData.length === 0) return [];

    const displayPatterns: Array<
        TrendPattern & {
            timeframe: TimeFrame;
            mappedStartIndex: number;
            mappedEndIndex: number;
        }
    > = [];

    (Object.keys(enabled) as TimeFrame[]).forEach((patternTimeframe) => {
        if (!enabled[patternTimeframe]) {
            console.log(`${patternTimeframe} 비활성화됨`);
            return;
        }

        if (!allPatterns[patternTimeframe]) {
            console.log(`${patternTimeframe} 패턴 없음`);
            return;
        }

        const patternData = timeframeData[patternTimeframe];
        if (!patternData || patternData.length === 0) {
            console.log(`${patternTimeframe} 데이터 없음`);
            return;
        }

        console.log(`${patternTimeframe} 처리 중: ${allPatterns[patternTimeframe].length}개 패턴`);

        allPatterns[patternTimeframe].forEach((pattern, idx) => {
            const startTime = patternData[pattern.startIndex]?.timestamp;
            const endTime = patternData[pattern.endIndex]?.timestamp;

            if (!startTime || !endTime) {
                console.log(`패턴 ${idx} 시간 정보 없음`);
                return;
            }

            // 임시로 원본 인덱스 그대로 사용 (매핑 문제 해결 위해)
            displayPatterns.push({
                ...pattern,
                timeframe: patternTimeframe,
                mappedStartIndex: pattern.startIndex,
                mappedEndIndex: pattern.endIndex,
            });

            console.log(`패턴 추가됨: ${patternTimeframe} ${idx}`);
        });
    });

    console.log(`총 표시할 패턴: ${displayPatterns.length}개`);
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
