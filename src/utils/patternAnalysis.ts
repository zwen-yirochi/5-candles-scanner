import { CandleData } from '../types/candle.types';
import { PatternTimeFrame, PatternZone } from '../types/pattern.types';

/**
 * Pine Script 방식 패턴 분석기
 *
 * 1. 캔들 방향 판별: close > open → bullish, close < open → bearish, else → doji(0)
 * 2. 연속 카운트: 같은 방향이면 count++, 다르면 리셋
 * 3. 방향 전환 시점에 이전 연속이 minLen 이상이면 → zone 생성
 * 4. zone 범위: 첫 번째 캔들의 몸통 (min(open,close) ~ max(open,close))
 * 5. 매 캔들마다 기존 zone의 돌파 여부 검사
 */
export class PatternAnalyzer {
  /**
   * 연속 동일 방향 캔들 패턴을 찾고, 돌파 판정까지 수행하여 PatternZone[] 반환
   */
  static analyzeZones(
    data: CandleData[],
    timeframe: PatternTimeFrame,
    minLength: number = 5,
    maxZones: number = 200
  ): PatternZone[] {
    if (data.length < minLength) return [];

    const zones: PatternZone[] = [];

    let consecutiveCount = 1;
    let currentType: 'bullish' | 'bearish' | null = null;
    let sequenceStart = 0;

    // 첫 캔들 방향
    if (data[0].close > data[0].open) currentType = 'bullish';
    else if (data[0].close < data[0].open) currentType = 'bearish';

    for (let i = 1; i < data.length; i++) {
      const candle = data[i];
      let candleType: 'bullish' | 'bearish' | null = null;
      if (candle.close > candle.open) candleType = 'bullish';
      else if (candle.close < candle.open) candleType = 'bearish';

      if (candleType === currentType && candleType !== null) {
        consecutiveCount++;
      } else {
        // 방향 전환 — 이전 시퀀스 확인
        if (consecutiveCount >= minLength && currentType !== null) {
          const firstCandle = data[sequenceStart];
          const lastCandle = data[sequenceStart + consecutiveCount - 1];

          zones.push({
            id: `${timeframe}-${sequenceStart}`,
            type: currentType,
            timeframe,
            startIndex: sequenceStart,
            endIndex: sequenceStart + consecutiveCount - 1,
            length: consecutiveCount,
            startTimestamp: firstCandle.timestamp,
            endTimestamp: lastCandle.timestamp,
            zoneTop: Math.max(firstCandle.open, firstCandle.close),
            zoneBottom: Math.min(firstCandle.open, firstCandle.close),
            isActive: true,
          });
        }

        currentType = candleType;
        sequenceStart = i;
        consecutiveCount = 1;
      }
    }

    // 마지막 시퀀스
    if (consecutiveCount >= minLength && currentType !== null) {
      const firstCandle = data[sequenceStart];
      const lastCandle = data[sequenceStart + consecutiveCount - 1];

      zones.push({
        id: `${timeframe}-${sequenceStart}`,
        type: currentType,
        timeframe,
        startIndex: sequenceStart,
        endIndex: sequenceStart + consecutiveCount - 1,
        length: consecutiveCount,
        startTimestamp: firstCandle.timestamp,
        endTimestamp: lastCandle.timestamp,
        zoneTop: Math.max(firstCandle.open, firstCandle.close),
        zoneBottom: Math.min(firstCandle.open, firstCandle.close),
        isActive: true,
      });
    }

    // 돌파 판정 — 패턴 이후 캔들의 종가로 판정
    for (const zone of zones) {
      for (let i = zone.endIndex + 1; i < data.length; i++) {
        const candle = data[i];
        if (!candle) continue;

        const isBroken =
          zone.type === 'bullish'
            ? candle.close < zone.zoneBottom // 지지 하향 돌파
            : candle.close > zone.zoneTop; // 저항 상향 돌파

        if (isBroken) {
          zone.isActive = false;
          zone.brokenAtTimestamp = candle.timestamp;
          break;
        }
      }
    }

    // maxZones 제한: 최신 zone 우선 (뒤에서부터)
    if (zones.length > maxZones) {
      return zones.slice(zones.length - maxZones);
    }

    return zones;
  }
}
