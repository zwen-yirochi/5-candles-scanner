import { useAtomValue } from 'jotai';
import React from 'react';
import { chartStatsAtom } from '../../../stores/atoms/dataAtoms';
import { IntervalBar } from './IntervalBar';
import { PriceInfo } from './PriceInfo';
import { SymbolBar } from './SymbolBar';

export const ChartHeader: React.FC = () => {
  const stats = useAtomValue(chartStatsAtom);

  if (!stats) return null;

  const { currentPrice, priceChangePercent, high, low, isPositive } = stats;

  return (
    <div className="p-4 text-white bg-black">
      <SymbolBar priceChangePercent={priceChangePercent} isPositive={isPositive} />
      <PriceInfo currentPrice={currentPrice} high={high} low={low} isPositive={isPositive} />
      <IntervalBar />
    </div>
  );
};
