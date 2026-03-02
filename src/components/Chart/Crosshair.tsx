import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback, useEffect, useRef } from 'react';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import { CandleData } from '../../types/candle.types';
import { visibleDataAtom } from '../../stores/atoms/dataAtoms';
import { indexDomainAtom, priceDomainAtom } from '../../stores/atoms/domainAtoms';
import { crosshairPositionAtom, isCrosshairActiveAtom } from '../../stores/atoms/interactionAtoms';

function formatPrice(price: number): string {
  const abs = Math.abs(price);
  const fixed = abs.toFixed(2);
  const [int, dec] = fixed.split('.');
  let result = '';
  for (let i = int.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) result = ',' + result;
    result = int[i] + result;
  }
  return (price < 0 ? '-' : '') + result + '.' + dec;
}

function formatTime(candle: CandleData): string {
  const date = new Date(candle.timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

function pixelToPrice(y: number, height: number, minPrice: number, maxPrice: number): number {
  const range = maxPrice - minPrice;
  return maxPrice - (y / height) * range;
}

export const Crosshair: React.FC = () => {
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const [crosshairPos, setCrosshairPos] = useAtom(crosshairPositionAtom);
  const isCrosshairActive = useAtomValue(isCrosshairActiveAtom);
  const visibleData = useAtomValue(visibleDataAtom);
  const indexDomain = useAtomValue(indexDomainAtom);
  const priceDomain = useAtomValue(priceDomainAtom);

  // 터치 후 합성 마우스 이벤트 차단용 타임스탬프
  const lastTouchTimeRef = useRef(0);

  useEffect(() => {
    const trackTouch = () => {
      lastTouchTimeRef.current = Date.now();
    };
    document.addEventListener('touchstart', trackTouch, true);
    document.addEventListener('touchend', trackTouch, true);
    return () => {
      document.removeEventListener('touchstart', trackTouch, true);
      document.removeEventListener('touchend', trackTouch, true);
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isCrosshairActive || Date.now() - lastTouchTimeRef.current < 400) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setCrosshairPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        source: 'mouse',
      });
    },
    [isCrosshairActive, setCrosshairPos],
  );

  const handleMouseLeave = useCallback(() => {
    if (isCrosshairActive || Date.now() - lastTouchTimeRef.current < 400) return;
    setCrosshairPos(null);
  }, [isCrosshairActive, setCrosshairPos]);

  const currentPrice = crosshairPos
    ? pixelToPrice(crosshairPos.y, height, priceDomain.minPrice, priceDomain.maxPrice)
    : 0;

  const indexRange = indexDomain.endIndex - indexDomain.startIndex;
  const hoveredIndex = crosshairPos ? Math.floor((crosshairPos.x / width) * indexRange) : -1;
  const currentTime =
    hoveredIndex >= 0 && hoveredIndex < visibleData.length
      ? formatTime(visibleData[hoveredIndex])
      : '';

  return (
    <>
      {/* 투명 오버레이 (마우스 이벤트 캡처용, 터치는 useTouchGestures가 처리) */}
      <div className="absolute inset-0 z-10" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />

      {crosshairPos && (
        <>
          {/* 수직선 */}
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none"
            style={{ left: `${crosshairPos.x}px`, width: '1px', background: '#9CA3AF', opacity: 0.6 }}
          />

          {/* 수평선 */}
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `${crosshairPos.y}px`, height: '1px', background: '#9CA3AF', opacity: 0.6 }}
          />

          {/* 가격 라벨 (우측) */}
          <div
            className="absolute right-0 z-20 px-1 sm:px-2 py-0.5 sm:py-1 font-mono text-[10px] sm:text-xs text-gray-600 transform -translate-y-1/2 bg-white border border-gray-300 rounded pointer-events-none"
            style={{ top: `${crosshairPos.y}px` }}
          >
            ${formatPrice(currentPrice)}
          </div>

          {/* 시간 라벨 (하단) */}
          {currentTime && (
            <div
              className="absolute bottom-0 z-20 px-1 sm:px-2 py-0.5 sm:py-1 font-mono text-[10px] sm:text-xs text-gray-600 transform -translate-x-1/2 bg-white border border-gray-300 rounded pointer-events-none"
              style={{ left: `${crosshairPos.x}px` }}
            >
              {currentTime}
            </div>
          )}

          {/* 터치 인디케이터 (터치 소스일 때만 표시) */}
          {crosshairPos.source === 'touch' && (
            <div
              className="absolute z-20 rounded-full pointer-events-none border-2 border-gray-400"
              style={{
                left: `${crosshairPos.x - 20}px`,
                top: `${crosshairPos.y - 20}px`,
                width: '40px',
                height: '40px',
                opacity: 0.4,
              }}
            />
          )}
        </>
      )}
    </>
  );
};
