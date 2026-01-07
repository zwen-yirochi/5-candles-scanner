import React, { useEffect, useMemo } from 'react';
import { CHART_COLORS } from '../../constants/chart.constants';
import { useChart } from '../../hooks/useChart';
import { usePatternAnalysis } from '../../hooks/usePatternAnalysis';
import { CandleData } from '../../types/candle.types';
import { candleToPixels } from '../../utils/domainToRange';
import { getVisiblePriceLabels } from '../../utils/priceLabel';
import { Candlestick } from './Candlestick';
import { Crosshair } from './Crosshair';
import { CurrentPriceLine } from './CurrentPriceLine';
import { HighLowLines } from './HighLowLines';
import { PriceAxis } from './PriceAxis';
import { TimeAxis } from './TimeAxis';

export interface CandlestickChartProps {
  data: CandleData[];
  width: number;
  height: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, width, height }) => {
  const chartWidth = width - 40;
  const chart = useChart(data, chartWidth, height);
  const { timeframeData, patterns, loading, error } = usePatternAnalysis('BTCUSDT');

  const currentPrice = useMemo(() => {
    return data.length > 0 ? data[data.length - 1].close : undefined;
  }, [data]);

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
        {/* <PatternControlPanel /> */}
        <div className="flex w-full">
          {/* Main Chart */}
          <div>
            <div
              className={`relative overflow-hidden ${CHART_COLORS.BACKGROUND} `}
              style={{ width: chartWidth, height }}
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
              {/* <PatternOverlay width={chartWidth} height={height} /> */}

              {/* High/Low Lines */}
              <HighLowLines width={chartWidth} height={height} />

              {/* Current Price Line */}
              <CurrentPriceLine width={chartWidth} height={height} />

              {/* Crosshair */}
              <Crosshair width={chartWidth} height={height} />
            </div>

            {/* Time Axis */}
            <TimeAxis width={chartWidth} />
          </div>

          {/* Price Axis */}
          <PriceAxis height={height} currentPrice={currentPrice} />
        </div>
      </div>
    </div>
  );
};
