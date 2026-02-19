import React from 'react';
import { PatternControlPanel } from '../PatternControlPanel';
import { ConnectionStatus } from './ConnectionStatus';
import { IntervalBar } from './IntervalBar';
import { PriceInfo } from './PriceInfo';
import { SymbolBar } from './SymbolBar';

export const ChartHeader: React.FC = () => {
  return (
    <div className="p-4 text-gray-800">
      <div className="flex gap-4 mb-6 ">
        <SymbolBar />
        <ConnectionStatus />
      </div>
      <PriceInfo />
      <div className="flex items-center gap-4">
        <IntervalBar />
        <div className="w-px h-4 bg-neutral-300" />
        <PatternControlPanel />
      </div>
    </div>
  );
};
