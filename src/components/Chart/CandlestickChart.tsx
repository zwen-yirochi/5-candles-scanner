// CandlestickChart.tsx
import React from 'react';
import { useCandleCanvas } from '../../hooks/useCandleCanvas';
import { useChartData } from '../../hooks/useChartData';
import { useChartInit } from '../../hooks/useChartInit';
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

  if (error) throw new Error(error);
  if (loading) return null;

  return (
    <div className="flex w-full p-4">
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
  );
};
