export type PatternTimeFrame = '15m' | '30m' | '1h' | '4h';

/** 패턴 분석 결과 — 특정 타임프레임 데이터 기준 */
export interface PatternZone {
  id: string; // `${timeframe}-${startIndex}`
  type: 'bullish' | 'bearish';
  timeframe: PatternTimeFrame;

  // 해당 TF 데이터 내 인덱스
  startIndex: number;
  endIndex: number;
  length: number; // 연속 캔들 수

  // 타임프레임 간 매핑을 위한 절대 시간
  startTimestamp: number; // 첫 캔들의 timestamp
  endTimestamp: number; // 마지막 캔들의 timestamp

  // zone 영역 = 첫 번째 캔들의 몸통 (절대 가격)
  zoneTop: number; // max(open, close)
  zoneBottom: number; // min(open, close)

  // 돌파 상태
  isActive: boolean;
  brokenAtTimestamp?: number; // 돌파 시점의 timestamp (cut용)
}

/** 현재 차트 좌표계에 매핑된 zone — 렌더링용 */
export interface DisplayZone {
  zone: PatternZone;

  // 현재 차트의 rawData 인덱스로 매핑된 좌표
  chartStartIndex: number; // startTimestamp → 현재 차트 인덱스
  chartEndIndex: number | null; // 활성이면 null (차트 끝까지), 돌파면 brokenAt 인덱스
}

export interface PatternSettings {
  enabled: boolean;
  minLength: number; // 기본 5
  breakAction: 'cut' | 'delete';
  maxZones: number; // 기본 200
}
