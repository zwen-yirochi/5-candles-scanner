import { useAtomValue } from 'jotai';
import React, { useCallback, useState } from 'react';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import { visibleDataAtom } from '../../stores/atoms/dataAtoms';
import { indexDomainAtom, priceDomainAtom } from '../../stores/atoms/domainAtoms';

export const Crosshair: React.FC = () => {
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const visibleData = useAtomValue(visibleDataAtom);
  const indexDomain = useAtomValue(indexDomainAtom);
  const priceDomain = useAtomValue(priceDomainAtom);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  }, [setMousePos]);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
  }, [setMousePos]);

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

  const currentPrice = mousePos ? pixelToPrice(mousePos.y) : 0;
  const currentTime = mousePos ? pixelToTime(mousePos.x) : '';
  return (
    <>
      {/* 투명 오버레이 (이벤트 캡처용) */}
      <div className="absolute inset-0 z-10" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />

      {mousePos && (
        <>
          {/* 수직선 */}
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none"
            style={{ left: `${mousePos.x}px`, width: '1px', background: '#9CA3AF', opacity: 0.6 }}
          />

          {/* 수평선 */}
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `${mousePos.y}px`, height: '1px', background: '#9CA3AF', opacity: 0.6 }}
          />

          {/* 가격 라벨 (우측) */}
          <div
            className="absolute right-0 z-20 px-2 py-1 font-mono text-xs text-gray-600 transform -translate-y-1/2 bg-white border border-gray-300 rounded pointer-events-none"
            style={{ top: `${mousePos.y}px` }}
          >
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {/* 시간 라벨 (하단) */}
          {currentTime && (
            <div
              className="absolute bottom-0 z-20 px-2 py-1 font-mono text-xs text-gray-600 transform -translate-x-1/2 bg-white border border-gray-300 rounded pointer-events-none"
              style={{ left: `${mousePos.x}px` }}
            >
              {currentTime}
            </div>
          )}
        </>
      )}
    </>
  );
};
