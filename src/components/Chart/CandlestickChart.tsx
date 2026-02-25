import { useAtomValue } from 'jotai';
import React from 'react';
import { useCandleCanvas } from '../../hooks/useCandleCanvas';
import { useChartData } from '../../hooks/useChartData';
import { useChartInit } from '../../hooks/useChartInit';
import { usePatternAnalysis } from '../../hooks/usePatternAnalysis';
import { symbolAtom } from '../../stores/atoms/chartConfigAtoms';
import { ChartErrorBoundary } from '../common';
import { CandleTooltip } from './CandleTooltip';
import { ChartArea } from './ChartArea';
import { Crosshair } from './Crosshair';
import { CurrentPriceLine } from './CurrentPriceLine';
import { HighLowLines } from './HighLowLines';
import { PriceAxis } from './PriceAxis';
import { TimeAxis } from './TimeAxis';

export const CandlestickChart: React.FC = () => {
  const { loading, error } = useChartData();
  useChartInit();
  const canvasRef = useCandleCanvas();

  const symbol = useAtomValue(symbolAtom);
  usePatternAnalysis(symbol);

  if (error) throw new Error(error);
  if (loading) return null;

  return (
    <div className="w-full sm:p-4">
      <div className="flex">
        <div>
          <ChartErrorBoundary>
            <ChartArea>
              <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }} />
              <HighLowLines />
              <CurrentPriceLine />
              <Crosshair />
              <CandleTooltip />
            </ChartArea>
          </ChartErrorBoundary>

          <TimeAxis />
        </div>

        <PriceAxis />
      </div>
    </div>
  );
};
