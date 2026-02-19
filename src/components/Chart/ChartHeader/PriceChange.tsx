import { useAtomValue } from 'jotai';
import React from 'react';
import { chartStatsAtom } from '../../../stores/atoms/dataAtoms';

export const PriceChange: React.FC = () => {
  const stats = useAtomValue(chartStatsAtom);

  if (!stats) return null;

  const { priceChangePercent, isPositive } = stats;
  const priceColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <span className={`text-lg font-semibold ${priceColor}`}>
      {isPositive ? '+' : ''}
      {priceChangePercent.toFixed(2)}%
    </span>
  );
};
