import { useAtomValue } from 'jotai';
import React from 'react';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import { currentPriceAtom } from '../../stores/atoms/dataAtoms';
import { priceDomainAtom } from '../../stores/atoms/domainAtoms';

export const CurrentPriceLine: React.FC = () => {
  const { height } = useAtomValue(chartDimensionsAtom);
  const currentPrice = useAtomValue(currentPriceAtom);
  const priceDomain = useAtomValue(priceDomainAtom);

  if (!currentPrice) return null;

  const priceRange = priceDomain.maxPrice - priceDomain.minPrice;
  const y = height - ((currentPrice - priceDomain.minPrice) / priceRange) * height;

  return (
    <div className="absolute pointer-events-none" style={{ top: `${y}px`, left: 0, right: 0 }}>
      <div className="absolute h-px bg-gray-300" style={{ width: '100%', opacity: 0.8 }} />
    </div>
  );
};
