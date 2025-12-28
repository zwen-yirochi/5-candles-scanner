// utils/patternAnalysis.ts
import { CandleData } from '../types/candle.types';

export interface TrendPattern {
    type: 'bullish' | 'bearish';
    startIndex: number;
    endIndex: number;
    length: number;
    strength: number;
    avgChange: number;
    brokenAt?: number; // 돌파된 시점의 인덱스
    isActive: boolean;
}

export class PatternAnalyzer {
    static findConsecutiveTrends(data: CandleData[], minLength: number = 5): TrendPattern[] {
        const patterns: TrendPattern[] = [];

        if (data.length < minLength) return patterns;

        let consecutiveCount = 1;
        let currentType: 'bullish' | 'bearish' | null = null;
        let sequenceStart = 0;

        // 첫 번째 캔들의 타입 결정
        if (data[0].close > data[0].open) {
            currentType = 'bullish';
        } else if (data[0].close < data[0].open) {
            currentType = 'bearish';
        }

        for (let i = 1; i < data.length; i++) {
            const candle = data[i];
            const isBullish = candle.close > candle.open;
            const isBearish = candle.close < candle.open;

            let candleType: 'bullish' | 'bearish' | null = null;
            if (isBullish) candleType = 'bullish';
            else if (isBearish) candleType = 'bearish';

            if (candleType === currentType && candleType !== null) {
                // 같은 타입이 연속됨
                consecutiveCount++;
            } else {
                // 연속이 끊어짐 - 이전 시퀀스 확인
                if (consecutiveCount >= minLength && currentType !== null) {
                    patterns.push({
                        type: currentType,
                        startIndex: sequenceStart,
                        endIndex: sequenceStart + consecutiveCount - 1,
                        length: consecutiveCount,
                        strength: 0,
                        avgChange: 0,
                        isActive: true,
                    });
                }

                // 새 시퀀스 시작
                currentType = candleType;
                sequenceStart = i;
                consecutiveCount = 1;
            }
        }

        // 마지막 시퀀스 확인
        if (consecutiveCount >= minLength && currentType !== null) {
            patterns.push({
                type: currentType,
                startIndex: sequenceStart,
                endIndex: sequenceStart + consecutiveCount - 1,
                length: consecutiveCount,
                strength: 0,
                avgChange: 0,
                isActive: true,
            });
        }

        return patterns;
    }

    static isPatternBroken(data: CandleData[], pattern: TrendPattern): boolean {
        const patternEndIndex = pattern.endIndex;

        // 패턴 이후 캔들들이 있는지 확인
        if (patternEndIndex >= data.length - 1) {
            return false; // 패턴 이후 캔들이 없으면 돌파 여부 알 수 없음
        }

        // 패턴 구간의 가격 범위 계산
        let patternHigh = -Infinity;
        let patternLow = Infinity;

        for (let i = pattern.startIndex; i <= pattern.endIndex; i++) {
            if (data[i]) {
                patternHigh = Math.max(patternHigh, data[i].high);
                patternLow = Math.min(patternLow, data[i].low);
            }
        }

        // 패턴 이후의 모든 캔들 검사
        for (let i = patternEndIndex + 1; i < data.length; i++) {
            const candle = data[i];
            if (!candle) continue;

            if (pattern.type === 'bullish') {
                // 상승 패턴: 지지선(패턴 최저가)을 종가가 하향 돌파하면 무효
                if (candle.close < patternLow) {
                    return true; // 돌파됨
                }
            } else {
                // 하락 패턴: 저항선(패턴 최고가)을 종가가 상향 돌파하면 무효
                if (candle.close > patternHigh) {
                    return true; // 돌파됨
                }
            }
        }

        return false; // 돌파되지 않음
    }

    // 유효한 패턴만 필터링하는 메서드
    static findValidConsecutiveTrends(data: CandleData[], minLength: number = 5): TrendPattern[] {
        const allPatterns = this.findConsecutiveTrends(data, minLength);

        return allPatterns.filter((pattern) => !this.isPatternBroken(data, pattern));
    }

    static findPatternsWithBreakInfo(data: CandleData[], minLength: number = 5): TrendPattern[] {
        const allPatterns = this.findConsecutiveTrends(data, minLength);

        return allPatterns.map((pattern) => {
            const breakInfo = this.findBreakPoint(data, pattern);

            return {
                ...pattern,
                brokenAt: breakInfo.brokenAt,
                isActive: !breakInfo.isBroken,
            };
        });
    }

    // 돌파 시점을 찾는 메서드
    static findBreakPoint(
        data: CandleData[],
        pattern: TrendPattern
    ): {
        isBroken: boolean;
        brokenAt?: number;
    } {
        const patternEndIndex = pattern.endIndex;

        if (patternEndIndex >= data.length - 1) {
            return { isBroken: false };
        }

        // 패턴 구간의 가격 범위
        let patternHigh = -Infinity;
        let patternLow = Infinity;

        for (let i = pattern.startIndex; i <= pattern.endIndex; i++) {
            if (data[i]) {
                patternHigh = Math.max(patternHigh, data[i].high);
                patternLow = Math.min(patternLow, data[i].low);
            }
        }

        // 패턴 이후 캔들들 검사
        for (let i = patternEndIndex + 1; i < data.length; i++) {
            const candle = data[i];
            if (!candle) continue;

            if (pattern.type === 'bullish') {
                if (candle.close < patternLow) {
                    return { isBroken: true, brokenAt: i };
                }
            } else {
                if (candle.close > patternHigh) {
                    return { isBroken: true, brokenAt: i };
                }
            }
        }

        return { isBroken: false };
    }
}
