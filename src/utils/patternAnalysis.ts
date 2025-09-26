// utils/patternAnalysis.ts
import { CandleData } from '../types/candle.types';

export interface TrendPattern {
    type: 'bullish' | 'bearish';
    startIndex: number;
    endIndex: number;
    length: number;
    strength: number;
    avgChange: number;
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
            });
        }

        return patterns;
    }
}
