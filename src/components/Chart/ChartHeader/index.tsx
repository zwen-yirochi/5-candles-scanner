import React from 'react';
import { PatternControlPanel } from '../PatternControlPanel';
import { ConnectionStatus } from './ConnectionStatus';
import { IntervalBar } from './IntervalBar';
import { PriceInfo } from './PriceInfo';
import { SymbolBar } from './SymbolBar';

export const ChartHeader: React.FC = () => {
  return (
    <div className="p-1.5 text-gray-800 sm:p-4">
      <div className="flex flex-row gap-1.5 mb-2 sm:gap-4 sm:mb-6">
        <SymbolBar />
        <ConnectionStatus />
      </div>
      <PriceInfo />
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <IntervalBar />
        <div className="hidden w-px h-4 sm:block bg-neutral-300" />
        <PatternControlPanel />
      </div>
    </div>
  );
};
