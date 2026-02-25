import { useAtom } from 'jotai';
import React from 'react';
import { CHART_INTERVALS } from '../../../constants/chart.constants';
import { intervalAtom } from '../../../stores/atoms/chartConfigAtoms';
import { Button } from '../../common';

export const IntervalBar: React.FC = () => {
  const [interval, setInterval] = useAtom(intervalAtom);

  return (
    <div className="flex items-center gap-1 flex-wrap">
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
  );
};
