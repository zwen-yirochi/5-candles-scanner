// CandlestickChart.tsx
import { useAtomValue } from 'jotai';
import React, { useMemo, useRef } from 'react';
import { CHART_COLORS } from '../../constants/chart.constants';
import { useCandleCanvas } from '../../hooks/useCandleCanvas';
import { useCandleHover } from '../../hooks/useCandleHover';
import { useChart } from '../../hooks/useChart';
import { useChartData } from '../../hooks/useChartData';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import { rawDataAtom } from '../../stores/atoms/dataAtoms';
import { getVisiblePriceLabels } from '../../utils/priceLabel';
import { CandleTooltip } from './CandleTooltip';
import { Crosshair } from './Crosshair';
import { CurrentPriceLine } from './CurrentPriceLine';
import { HighLowLines } from './HighLowLines';
import { PriceAxis } from './PriceAxis';
import { TimeAxis } from './TimeAxis';

export const CandlestickChart: React.FC = () => {
  const { loading, error } = useChartData();
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const chartData = useAtomValue(rawDataAtom);
  const chart = useChart(width, height);

  const canvasRef = useCandleCanvas();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const candleHover = useCandleHover(chartContainerRef);

  const gridLines = useMemo(() => {
    const { labels } = getVisiblePriceLabels(chart.domain.price.minPrice, chart.domain.price.maxPrice, 10);
    const priceRange = chart.domain.price.maxPrice - chart.domain.price.minPrice;
    return labels.map((price) => {
      const y = height - ((price - chart.domain.price.minPrice) / priceRange) * height;
      return { price, y };
    });
  }, [chart.domain.price, height]);

  if (error) throw new Error(error);
  if (loading || chartData.length === 0 || width === 0 || height === 0) return null;

  return (
    <div className="p-4">
      <div className="flex w-full">
        <div>
          <div
            ref={chartContainerRef}
            className={`relative overflow-hidden ${CHART_COLORS.BACKGROUND}`}
            style={{ width: width, height }}
            onWheel={chart.handleWheel}
            onMouseDown={chart.handleMouseDown}
            onMouseMove={candleHover.handleMouseMove}
            onMouseLeave={candleHover.handleMouseLeave}
            onTouchStart={candleHover.handleTouchStart}
            onTouchMove={candleHover.handleTouchMove}
            onTouchEnd={candleHover.handleTouchEnd}
          >
            {/* Grid Lines */}
            {gridLines.map((line) => (
              <div
                key={line.price}
                className="absolute left-0 right-0 border-t border-gray-700"
                style={{ top: `${line.y}px` }}
              />
            ))}

            {/*  Canvas - Candlesticks */}
            <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }} />

            {/* Overlays */}
            <HighLowLines width={width} height={height} />
            <CurrentPriceLine width={width} height={height} />
            <Crosshair width={width} height={height} />

            {/* Candle Tooltip */}
            <CandleTooltip />
          </div>

          <TimeAxis width={width} />
        </div>

        <PriceAxis height={height} />
      </div>
    </div>
  );
};
