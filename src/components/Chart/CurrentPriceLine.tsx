import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { rawDataAtom } from '../../stores/atoms/dataAtoms';
import { priceDomainAtom } from '../../stores/atoms/domainAtoms';

interface CurrentPriceLineProps {
  width: number;
  height: number;
}

export const CurrentPriceLine: React.FC<CurrentPriceLineProps> = ({ width, height }) => {
  const rawData = useAtomValue(rawDataAtom);
  const priceDomain = useAtomValue(priceDomainAtom);
  const currentPrice = useMemo(() => {
    if (rawData.length === 0) return null;

    // 항상 전체 데이터의 가장 최근 캔들의 종가 사용 (차트 스크롤과 무관)
    return rawData[rawData.length - 1].close;
  }, [rawData]);

  if (!currentPrice) return null;
  const priceToPixel = (price: number): number => {
    const range = priceDomain.maxPrice - priceDomain.minPrice;
    return height - ((price - priceDomain.minPrice) / range) * height;
  };

  const y = priceToPixel(currentPrice);
  // 현재 가격이 이전 캔들 대비 상승/하락 여부 확인

  const isUp = rawData.length > 1 ? currentPrice >= rawData[rawData.length - 2].close : true;
  const lineColor = isUp ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="absolute pointer-events-none" style={{ top: `${y}px`, left: 0, right: 0 }}>
      {/* 수평선 */}
      <div className={`absolute h-px ${lineColor}`} style={{ width: '100%', opacity: 0.8 }} />
    </div>
  );
};
