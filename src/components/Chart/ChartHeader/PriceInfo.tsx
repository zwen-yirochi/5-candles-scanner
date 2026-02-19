import { useAtomValue } from 'jotai';
import React from 'react';
import { chartStatsAtom } from '../../../stores/atoms/dataAtoms';

const formatPrice = (price: number): string => {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const PriceInfo: React.FC = () => {
  const stats = useAtomValue(chartStatsAtom);

  if (!stats) return null;

  const { currentPrice, high, low, isPositive } = stats;
  const priceColor = isPositive ? 'text-gray-800' : 'text-gray-400';

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="mb-1 text-sm text-gray-400">Last Traded Price</div>
        <div className={`text-4xl font-bold mb-1 ${priceColor}`}>{formatPrice(currentPrice)}</div>
        <div className="text-sm text-gray-400">Mark Price {formatPrice(currentPrice)}</div>
      </div>

      <div className="text-right">
        <div className="flex gap-12">
          <div>
            <div className="mb-1 text-sm text-gray-400">24h High</div>
            <div className="text-base font-semibold">{formatPrice(high)}</div>
          </div>
          <div>
            <div className="mb-1 text-sm text-gray-400">24h Low</div>
            <div className="text-base font-semibold">{formatPrice(low)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
