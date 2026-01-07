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
    return rawData[rawData.length - 1].close;
  }, [rawData]);

  if (!currentPrice) return null;
  const priceToPixel = (price: number): number => {
    const range = priceDomain.maxPrice - priceDomain.minPrice;
    return height - ((price - priceDomain.minPrice) / range) * height;
  };

  const y = priceToPixel(currentPrice);

  const isUp = rawData.length > 1 ? currentPrice >= rawData[rawData.length - 2].close : true;
  const lineColor = isUp ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="absolute pointer-events-none" style={{ top: `${y}px`, left: 0, right: 0 }}>
      {/* 수평선 */}
      <div className={`absolute h-px ${lineColor}`} style={{ width: '100%', opacity: 0.8 }} />
    </div>
  );
};
