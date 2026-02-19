import { useAtomValue } from 'jotai';
import React from 'react';
import { hoveredCandleAtom, tooltipVisibleAtom } from '../../stores/atoms/interactionAtoms';

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

export const CandleTooltip: React.FC = () => {
  const hoveredCandleState = useAtomValue(hoveredCandleAtom);
  const visible = useAtomValue(tooltipVisibleAtom);

  if (!visible || !hoveredCandleState) return null;

  const { candle, prevCandle, tooltipPosition: position } = hoveredCandleState;

  const changePercent = prevCandle ? ((candle.close - prevCandle.close) / prevCandle.close) * 100 : null;

  const isPositive = changePercent !== null && changePercent >= 0;
  const changeColor = isPositive ? 'text-gray-800' : 'text-gray-400';
  const changeSymbol = isPositive ? '▲' : '▼';

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-2 text-xs text-gray-700 min-w-[140px]">
        {/* Timestamp */}
        <div className="pb-1 mb-1 text-gray-400 border-b border-gray-100">{formatTimestamp(candle.timestamp)}</div>

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
          <div className={`border-t border-gray-100 pt-1 mt-1 ${changeColor} font-medium`}>
            {changeSymbol} {isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
};
