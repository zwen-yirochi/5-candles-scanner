import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { visibleDataAtom } from '../../stores/atoms/dataAtoms';
import { priceDomainAtom } from '../../stores/atoms/domainAtoms';

interface CurrentPriceLineProps {
  width: number;
  height: number;
}

export const CurrentPriceLine: React.FC<CurrentPriceLineProps> = ({ width, height }) => {
  const visibleData = useAtomValue(visibleDataAtom);
  const priceDomain = useAtomValue(priceDomainAtom);
  const currentPrice = useMemo(() => {
    if (visibleData.length === 0) return null;

    // 가장 최근 캔들의 종가
    return visibleData[visibleData.length - 1].close;
  }, [visibleData]);

  if (!currentPrice) return null;
  const priceToPixel = (price: number): number => {
    const range = priceDomain.maxPrice - priceDomain.minPrice;
    return height - ((price - priceDomain.minPrice) / range) * height;
  };

  const y = priceToPixel(currentPrice);
  // 현재 가격이 이전 캔들 대비 상승/하락 여부 확인

  const isUp = visibleData.length > 1 ? currentPrice >= visibleData[visibleData.length - 2].close : true;
  const lineColor = isUp ? 'bg-green-500' : 'bg-red-500';
  const bgColor = isUp ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="absolute pointer-events-none" style={{ top: `${y}px`, left: 0, right: 0 }}>
      {/* 수평선 */}
      <div className={`absolute h-px ${lineColor}`} style={{ width: '100%', opacity: 0.8 }} />
      {/* 가격 라벨 (오른쪽) */}
      <div
        className={`absolute px-2 py-1 font-mono text-xs text-white ${bgColor} rounded whitespace-nowrap`}
        style={{ right: '-40px', top: '-12px' }}
      >
        {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
};
