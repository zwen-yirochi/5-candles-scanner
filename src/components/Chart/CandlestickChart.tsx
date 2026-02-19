// CandlestickChart.tsx
import { useAtomValue } from 'jotai';
import React from 'react';
import { useCandleCanvas } from '../../hooks/useCandleCanvas';
import { useChartData } from '../../hooks/useChartData';
import { useChartInit } from '../../hooks/useChartInit';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import { rawDataAtom } from '../../stores/atoms/dataAtoms';
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
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const chartData = useAtomValue(rawDataAtom);
  useChartInit(width, height);

  const canvasRef = useCandleCanvas();

  if (error) throw new Error(error);
  if (loading || chartData.length === 0 || width === 0 || height === 0) return null;

  return (
    <div className="flex w-full p-4">
      <div>
        <ChartErrorBoundary>
          <ChartArea>
            <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }} />
            <HighLowLines width={width} height={height} />
            <CurrentPriceLine width={width} height={height} />
            <Crosshair width={width} height={height} />
            <CandleTooltip />
          </ChartArea>
        </ChartErrorBoundary>

        <TimeAxis width={width} />
      </div>

      <PriceAxis height={height} />
    </div>
  );
};
