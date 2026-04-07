import { CandleData } from '../types/candle.types';
import { snapToMagnet } from './editorMagnet';

// 도메인 설정:
// index: startIndex=0, endIndex=2 → candleWidth = 200/2 = 100
// price: minPrice=80, maxPrice=120
// candle 0 centerX = indexToPixel(0, {0,2}, {200}) + 50 = 0 + 50 = 50
// candle 1 centerX = indexToPixel(1, {0,2}, {200}) + 50 = 100 + 50 = 150
// priceToPixel(price): y = 200 - (price - 80) / 40 * 200

const mockCandles: CandleData[] = [
  { timestamp: 1000, open: 100, high: 110, low: 90, close: 105, volume: 1 },
  { timestamp: 2000, open: 105, high: 115, low: 95, close: 110, volume: 1 },
];

const domain = {
  index: { startIndex: 0, endIndex: 2 },
  price: { minPrice: 80, maxPrice: 120 },
};
const range = { width: 200, height: 200 };

// candle 0:
//   centerX = 50
//   high(110):  y = 200 - 30/40*200 = 50
//   close(105): y = 200 - 25/40*200 = 75
//   open(100):  y = 200 - 20/40*200 = 100
//   low(90):    y = 200 - 10/40*200 = 150

describe('snapToMagnet', () => {
  it('threshold 이내 OHLC가 있으면 스냅 결과를 반환한다', () => {
    // candle 0의 high(110)에 가까운 위치 (centerX=50, y=50)
    const result = snapToMagnet(55, 55, mockCandles, domain, range, 20);
    expect(result).not.toBeNull();
    expect(result!.price).toBe(110);
    expect(result!.index).toBe(0);
  });

  it('가장 가까운 OHLC 값으로 스냅한다', () => {
    // (50, 50) = candle 0 high 정확한 위치 → high로 스냅
    const result = snapToMagnet(50, 50, mockCandles, domain, range, 20);
    expect(result).not.toBeNull();
    expect(result!.price).toBe(110);
  });

  it('threshold 초과 거리이면 null을 반환한다', () => {
    // candle 0 centerX=50, 가장 가까운 OHLC는 low(y=150)
    // 포인터 (50, 200): low(y=150)까지 50px → threshold 20 초과
    const result = snapToMagnet(50, 200, mockCandles, domain, range, 20);
    expect(result).toBeNull();
  });

  it('빈 캔들 배열이면 null을 반환한다', () => {
    expect(snapToMagnet(50, 50, [], domain, range)).toBeNull();
  });

  it('스냅 결과의 x는 캔들 centerX이다', () => {
    const result = snapToMagnet(50, 50, mockCandles, domain, range, 20);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(50); // candle 0 centerX
  });

  it('candle 1 영역 포인터는 candle 1로 스냅한다', () => {
    // candle 1: centerX=150, high(115): y = 200 - 35/40*200 = 25
    const result = snapToMagnet(150, 25, mockCandles, domain, range, 20);
    expect(result).not.toBeNull();
    expect(result!.index).toBe(1);
    expect(result!.price).toBe(115);
  });
});
