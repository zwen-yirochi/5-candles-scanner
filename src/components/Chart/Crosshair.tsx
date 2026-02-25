import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback } from 'react';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import { visibleDataAtom } from '../../stores/atoms/dataAtoms';
import { indexDomainAtom, priceDomainAtom } from '../../stores/atoms/domainAtoms';
import { crosshairPositionAtom } from '../../stores/atoms/interactionAtoms';

export const Crosshair: React.FC = () => {
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const [crosshairPos, setCrosshairPos] = useAtom(crosshairPositionAtom);
  const visibleData = useAtomValue(visibleDataAtom);
  const indexDomain = useAtomValue(indexDomainAtom);
  const priceDomain = useAtomValue(priceDomainAtom);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setCrosshairPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        source: 'mouse',
      });
    },
    [setCrosshairPos],
  );

  const handleMouseLeave = useCallback(() => {
    setCrosshairPos(null);
  }, [setCrosshairPos]);

  const pixelToPrice = (y: number): number => {
    const range = priceDomain.maxPrice - priceDomain.minPrice;
    return priceDomain.maxPrice - (y / height) * range;
  };

  const pixelToTime = (x: number): string => {
    const indexRange = indexDomain.endIndex - indexDomain.startIndex;
    const relativeIndex = (x / width) * indexRange;
    const hoveredIndex = Math.floor(relativeIndex);

    if (hoveredIndex >= 0 && hoveredIndex < visibleData.length) {
      const candle = visibleData[hoveredIndex];
      return new Date(candle.timestamp).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return '';
  };

  const currentPrice = crosshairPos ? pixelToPrice(crosshairPos.y) : 0;
  const currentTime = crosshairPos ? pixelToTime(crosshairPos.x) : '';

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
            className="absolute right-0 z-20 px-2 py-1 font-mono text-xs text-gray-600 transform -translate-y-1/2 bg-white border border-gray-300 rounded pointer-events-none"
            style={{ top: `${crosshairPos.y}px` }}
          >
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* 시간 라벨 (하단) */}
          {currentTime && (
            <div
              className="absolute bottom-0 z-20 px-2 py-1 font-mono text-xs text-gray-600 transform -translate-x-1/2 bg-white border border-gray-300 rounded pointer-events-none"
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
