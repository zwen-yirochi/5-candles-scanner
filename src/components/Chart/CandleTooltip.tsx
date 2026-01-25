import React from 'react';
import { CandleData } from '../../types/candle.types';

interface CandleTooltipProps {
  candle: CandleData;
  prevCandle: CandleData | null;
  position: { x: number; y: number };
  visible: boolean;
}

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

export const CandleTooltip: React.FC<CandleTooltipProps> = ({ candle, prevCandle, position, visible }) => {
  if (!visible) return null;

  const changePercent = prevCandle ? ((candle.close - prevCandle.close) / prevCandle.close) * 100 : null;

  const isPositive = changePercent !== null && changePercent >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const changeSymbol = isPositive ? '▲' : '▼';

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-lg p-2 text-xs text-white min-w-[140px]">
        {/* Timestamp */}
        <div className="pb-1 mb-1 text-gray-400 border-b border-gray-700">{formatTimestamp(candle.timestamp)}</div>

        {/* OHLCV Data */}
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span className="text-gray-400">Open:</span>
            <span>{formatNumber(candle.open)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">High:</span>
            <span>{formatNumber(candle.high)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Low:</span>
            <span>{formatNumber(candle.low)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Close:</span>
            <span>{formatNumber(candle.close)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Vol:</span>
            <span>{formatNumber(candle.volume, 4)}</span>
          </div>
        </div>

        {/* Change Percent */}
        {changePercent !== null && (
          <div className={`border-t border-gray-700 pt-1 mt-1 ${changeColor} font-medium`}>
            {changeSymbol} {isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
};
