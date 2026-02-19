import { useAtom, useAtomValue } from 'jotai';
import React from 'react';
import { CHART_INTERVALS, CHART_SYMBOLS } from '../../constants/chart.constants';
import { chartStatsAtom, intervalAtom, symbolAtom, wsConnectedAtom } from '../../stores/atoms/chartConfigAtoms';
import { Button, Select } from '../common';

const formatPrice = (price: number): string => {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const ChartHeader: React.FC = () => {
  const [symbol, setSymbol] = useAtom(symbolAtom);
  const [interval, setInterval] = useAtom(intervalAtom);
  const stats = useAtomValue(chartStatsAtom);
  const isWebSocketConnected = useAtomValue(wsConnectedAtom);

  if (!stats) return null;

  const { currentPrice, priceChangePercent, high, low, isPositive } = stats;
  const priceColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <div className="p-4 text-white bg-black">
      {/* Symbol & Change */}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Select options={CHART_SYMBOLS} value={symbol} onChange={setSymbol} />

          <span className={`text-lg font-semibold ${priceColor}`}>
            {isPositive ? '+' : ''}
            {priceChangePercent.toFixed(2)}%
          </span>

          {/* WebSocket Connection Status */}

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-gray-500'}`}
              title={isWebSocketConnected ? 'WebSocket 연결됨' : 'WebSocket 연결 안됨'}
            />

            <span className="text-xs text-gray-400">{isWebSocketConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>
      {/* Price Information */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="mb-1 text-sm text-gray-400">Last Traded Price</div>
          <div className={`text-4xl font-bold mb-1 ${priceColor}`}>{formatPrice(currentPrice)}</div>
          <div className="text-sm text-gray-400">Mark Price {formatPrice(currentPrice)}</div>
        </div>

        {/* 24h Statistics */}
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

      {/* Interval Selection */}
      <div className="flex items-center gap-3">
        {CHART_INTERVALS.map(({ value, label }) => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            active={interval === value}
            onClick={() => setInterval(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
