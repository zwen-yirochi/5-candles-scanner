import { useAtomValue } from 'jotai';
import React from 'react';
import { chartStatsAtom } from '../../../stores/atoms/dataAtoms';

export const PriceChange: React.FC = () => {
  const stats = useAtomValue(chartStatsAtom);

  if (!stats) return null;

  const { priceChangePercent, isPositive } = stats;
  const priceColor = isPositive ? 'text-gray-800' : 'text-gray-400';

  return (
    <span className={`text-sm sm:text-lg font-semibold ${priceColor}`}>
      {isPositive ? '+' : ''}
      {priceChangePercent.toFixed(2)}%
    </span>
  );
};
