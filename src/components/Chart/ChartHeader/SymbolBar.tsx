import { useAtom, useAtomValue } from 'jotai';
import React from 'react';
import { CHART_SYMBOLS } from '../../../constants/chart.constants';
import { symbolAtom } from '../../../stores/atoms/chartConfigAtoms';
import { wsConnectedAtom } from '../../../stores/atoms/dataAtoms';
import { Select } from '../../common';

interface SymbolBarProps {
  priceChangePercent: number;
  isPositive: boolean;
}

export const SymbolBar: React.FC<SymbolBarProps> = ({ priceChangePercent, isPositive }) => {
  const [symbol, setSymbol] = useAtom(symbolAtom);
  const isWebSocketConnected = useAtomValue(wsConnectedAtom);
  const priceColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Select options={CHART_SYMBOLS} value={symbol} onChange={setSymbol} />

        <span className={`text-lg font-semibold ${priceColor}`}>
          {isPositive ? '+' : ''}
          {priceChangePercent.toFixed(2)}%
        </span>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-gray-500'}`}
            title={isWebSocketConnected ? 'WebSocket 연결됨' : 'WebSocket 연결 안됨'}
          />
          <span className="text-xs text-gray-400">{isWebSocketConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );
};
