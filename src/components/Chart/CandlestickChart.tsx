import React, { useEffect, useMemo } from 'react';
import { CHART_COLORS, CHART_DIMENSIONS } from '../../constants/chart.constants';
import { useChart } from '../../hooks/useChart';
import { usePatternAnalysis } from '../../hooks/usePatternAnalysis';
import { CandleData } from '../../types/candle.types';
import { candleToPixels } from '../../utils/domainToRange';
import { getVisiblePriceLabels } from '../../utils/priceLabel';
import { Candlestick } from './Candlestick';
import { Crosshair } from './Crosshair';
import { HighLowLines } from './HighLowLines';
import { PatternControlPanel } from './PatternControlPanel';
import { PatternOverlay } from './PatternOverlay';
import { PriceAxis } from './PriceAxis';
import { TimeAxis } from './TimeAxis';

export interface CandlestickChartProps {
  data: CandleData[];
  width?: number;
  height?: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  width = CHART_DIMENSIONS.DEFAULT_WIDTH,
  height = CHART_DIMENSIONS.DEFAULT_HEIGHT,
}) => {
  const chart = useChart(data, width, height);
  const { timeframeData, patterns, loading, error } = usePatternAnalysis('BTCUSDT');

  // Calculate grid lines based on price labels
  const gridLines = useMemo(() => {
    const { labels } = getVisiblePriceLabels(chart.domain.price.minPrice, chart.domain.price.maxPrice, 10);
    const priceRange = chart.domain.price.maxPrice - chart.domain.price.minPrice;
    return labels.map((price) => {
      const y = height - ((price - chart.domain.price.minPrice) / priceRange) * height;
      return { price, y };
    });
  }, [chart.domain.price, height]);

  useEffect(() => {
    if (!loading && !error) {
      console.log('=== Loaded Data Count ===');
      Object.entries(timeframeData).forEach(([timeframe, data]) => {
        console.log(`${timeframe}: ${data.length} candles`);
      });
      console.log('=== Detected Patterns ===');
      let totalPatterns = 0;
      Object.entries(patterns).forEach(([timeframe, patternList]) => {
        console.log(`${timeframe}: ${patternList.length} patterns`);
        totalPatterns += patternList.length;
      });
      console.log(`Total patterns: ${totalPatterns}`);
    }
  }, [timeframeData, patterns, loading, error]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-black border-2 shadow-lg">
      <div className="p-4">
        {/* Pattern Control Panel */}
        <PatternControlPanel />
        <div className="flex">
          {/* Main Chart */}
          <div>
            <div
              className={`relative overflow-hidden ${CHART_COLORS.BACKGROUND} border-2 border-gray-600`}
              style={{ width, height }}
              onWheel={chart.handleWheel}
              onMouseDown={chart.handleMouseDown}
            >
              {/* Grid Lines - Aligned with price labels */}
              {gridLines.map((line) => (
                <div
                  key={line.price}
                  className="absolute left-0 right-0 border-t border-gray-700"
                  style={{ top: `${line.y}px` }}
                />
              ))}

              {/* Candlesticks */}
              {chart.visibleData.map((candle, i) => {
                const actualIndex = chart.domain.index.startIndex + i;
                const pos = candleToPixels(candle, actualIndex, chart.domain, chart.range);
                return <Candlestick key={actualIndex} data={candle} {...pos} />;
              })}

              {/* Pattern Overlay */}
              <PatternOverlay width={width} height={height} />

              {/* High/Low Lines */}
              <HighLowLines width={width} height={height} />

              {/* Crosshair */}
              <Crosshair width={width} height={height} />
            </div>

            {/* Time Axis */}
            <TimeAxis width={width} />
          </div>

          {/* Price Axis */}
          <PriceAxis height={height} />
        </div>
      </div>
    </div>
  );
};
