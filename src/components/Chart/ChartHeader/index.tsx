import React from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import { IntervalBar } from './IntervalBar';
import { PriceInfo } from './PriceInfo';
import { SymbolBar } from './SymbolBar';

export const ChartHeader: React.FC = () => {
  return (
    <div className="p-4 text-white">
      <div className="flex gap-4 mb-6 ">
        <SymbolBar />
        <ConnectionStatus />
      </div>
      <PriceInfo />
      <IntervalBar />
    </div>
  );
};
