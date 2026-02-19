import { useAtom } from 'jotai';
import React from 'react';
import { CHART_SYMBOLS } from '../../../constants/chart.constants';
import { symbolAtom } from '../../../stores/atoms/chartConfigAtoms';
import { Select } from '../../common';
import { PriceChange } from './PriceChange';

export const SymbolBar: React.FC = () => {
  const [symbol, setSymbol] = useAtom(symbolAtom);

  return (
    <div className="flex items-center gap-4">
      <Select options={CHART_SYMBOLS} value={symbol} onChange={setSymbol} />
      <PriceChange />
    </div>
  );
};
