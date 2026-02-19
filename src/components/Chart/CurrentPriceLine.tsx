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
      <div className="absolute" style={{ width: '100%', height: '1px', backgroundImage: 'repeating-linear-gradient(to right, #C8C8C8 0, #C8C8C8 4px, transparent 4px, transparent 8px)' }} />
    </div>
  );
};
