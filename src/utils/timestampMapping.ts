import { CandleData } from '../types/candle.types';

/**
 * 현재 차트의 rawData에서 주어진 timestamp에 가장 가까운 인덱스를 찾는다.
 * rawData는 시간순 정렬되어 있으므로 이진 탐색 사용.
 *
 * - timestamp가 rawData 범위보다 이전: 0 반환 (차트 왼쪽 끝)
 * - timestamp가 rawData 범위보다 이후: data.length - 1 반환 (차트 오른쪽 끝)
 */
export function findIndexByTimestamp(data: CandleData[], timestamp: number): number {
  if (data.length === 0) return 0;
  if (timestamp <= data[0].timestamp) return 0;
  if (timestamp >= data[data.length - 1].timestamp) return data.length - 1;

  let lo = 0;
  let hi = data.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const midTs = data[mid].timestamp;

    if (midTs === timestamp) return mid;
    if (midTs < timestamp) lo = mid + 1;
    else hi = mid - 1;
  }

  // lo는 timestamp보다 큰 첫 번째 인덱스, hi는 그 이전
  // 더 가까운 쪽을 반환
  if (lo >= data.length) return data.length - 1;
  if (hi < 0) return 0;

  const diffLo = data[lo].timestamp - timestamp;
  const diffHi = timestamp - data[hi].timestamp;
  return diffLo <= diffHi ? lo : hi;
}
