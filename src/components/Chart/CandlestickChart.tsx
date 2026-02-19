// CandlestickChart.tsx
import { useAtomValue } from 'jotai';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { CANDLESTICK, CHART_COLORS } from '../../constants/chart.constants';
import { useCandleHover } from '../../hooks/useCandleHover';
import { useChart } from '../../hooks/useChart';
import { useChartData } from '../../hooks/useChartData';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import { currentPriceAtom, rawDataAtom } from '../../stores/atoms/dataAtoms';
import { candleToPixels } from '../../utils/domainToRange';
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
  const currentPrice = useAtomValue(currentPriceAtom);
  const chartWidth = width - 40;
  const chart = useChart(chartWidth, height);
  // const { timeframeData, patterns, loading, error } = usePatternAnalysis('BTCUSDT');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  const candleHover = useCandleHover(chartData, chart.domain, chart.range);

  const handleChartMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (chartContainerRef.current) {
        candleHover.handleMouseMove(e, chartContainerRef.current.getBoundingClientRect());
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 개별 함수만 의존성으로 사용 (객체 전체 사용 시 불필요한 리렌더링 발생)
    [candleHover.handleMouseMove]
  );

  const handleChartTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (chartContainerRef.current) {
        candleHover.handleTouchStart(e, chartContainerRef.current.getBoundingClientRect());
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 개별 함수만 의존성으로 사용 (객체 전체 사용 시 불필요한 리렌더링 발생)
    [candleHover.handleTouchStart]
  );

  const currentPriceValue = currentPrice ?? undefined;

  const gridLines = useMemo(() => {
    const { labels } = getVisiblePriceLabels(chart.domain.price.minPrice, chart.domain.price.maxPrice, 10);
    const priceRange = chart.domain.price.maxPrice - chart.domain.price.minPrice;
    return labels.map((price) => {
      const y = height - ((price - chart.domain.price.minPrice) / priceRange) * height;
      return { price, y };
    });
  }, [chart.domain.price, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;

      const ctx = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true,
      });
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = chartWidth;
      const displayHeight = height;

      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      const risingCandles: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        wickY: number;
        wickHeight: number;
      }> = [];
      const fallingCandles: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        wickY: number;
        wickHeight: number;
      }> = [];

      chart.visibleData.forEach((candle, i) => {
        const actualIndex = chart.domain.index.startIndex + i;
        const pos = candleToPixels(candle, actualIndex, chart.domain, chart.range);

        const isRising = candle.close > candle.open;
        const candleData = {
          x: pos.x + pos.candleWidth * CANDLESTICK.BODY_OFFSET_RATIO,
          y: pos.bodyY,
          width: pos.candleWidth * CANDLESTICK.BODY_WIDTH_RATIO,
          height: Math.max(pos.bodyHeight, CANDLESTICK.MIN_BODY_HEIGHT),
          wickY: pos.highY,
          wickHeight: pos.wickHeight,
        };

        if (isRising) {
          risingCandles.push(candleData);
        } else {
          fallingCandles.push(candleData);
        }
      });

      //  상승 캔들
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = CANDLESTICK.WICK_WIDTH;

      risingCandles.forEach((candle) => {
        // Wick
        ctx.beginPath();
        ctx.moveTo(candle.x + candle.width / 2, candle.wickY);
        ctx.lineTo(candle.x + candle.width / 2, candle.wickY + candle.wickHeight);
        ctx.stroke();

        // Body
        ctx.fillRect(candle.x, candle.y, candle.width, candle.height);
      });

      // 하락 캔들
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ef4444';

      fallingCandles.forEach((candle) => {
        // Wick
        ctx.beginPath();
        ctx.moveTo(candle.x + candle.width / 2, candle.wickY);
        ctx.lineTo(candle.x + candle.width / 2, candle.wickY + candle.wickHeight);
        ctx.stroke();

        // Body
        ctx.fillRect(candle.x, candle.y, candle.width, candle.height);
      });
    });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [chart.visibleData, chart.domain, chart.range, chartWidth, height]);

  if (error) throw new Error(error);
  if (loading || chartData.length === 0 || width === 0 || height === 0) return null;

  return (
    <div className="bg-black border-2 shadow-lg">
      <div className="p-4">
        <div className="flex w-full">
          <div>
            <div
              ref={chartContainerRef}
              className={`relative overflow-hidden ${CHART_COLORS.BACKGROUND}`}
              style={{ width: chartWidth, height }}
              onWheel={chart.handleWheel}
              onMouseDown={chart.handleMouseDown}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={candleHover.handleMouseLeave}
              onTouchStart={handleChartTouchStart}
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
              <HighLowLines width={chartWidth} height={height} />
              <CurrentPriceLine width={chartWidth} height={height} />
              <Crosshair width={chartWidth} height={height} />

              {/* Candle Tooltip */}
              <CandleTooltip />
            </div>

            <TimeAxis width={chartWidth} />
          </div>

          <PriceAxis height={height} currentPrice={currentPriceValue} />
        </div>
      </div>
    </div>
  );
};
