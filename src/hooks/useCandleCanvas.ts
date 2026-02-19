import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { CANDLESTICK } from '../constants/chart.constants';
import { chartDimensionsAtom } from '../stores/atoms/chartConfigAtoms';
import { visibleDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom } from '../stores/atoms/domainAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { candleToPixels } from '../utils/domainToRange';
import { getVisiblePriceLabels } from '../utils/priceLabel';

export const useCandleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef = useRef<number | null>(null);

  const visibleData = useAtomValue(visibleDataAtom);
  const domain = useAtomValue(chartDomainAtom);
  const range = useAtomValue(chartRangeAtom);
  const { width, height } = useAtomValue(chartDimensionsAtom);

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

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // 1. 배경
      ctx.fillStyle = '#F5F5F0';
      ctx.fillRect(0, 0, width, height);

      // 2. Grid Lines
      const { labels } = getVisiblePriceLabels(domain.price.minPrice, domain.price.maxPrice, 10);
      const priceRange = domain.price.maxPrice - domain.price.minPrice;
      ctx.strokeStyle = '#E8E8E3';
      ctx.lineWidth = 1;
      labels.forEach((price) => {
        const y = Math.round(height - ((price - domain.price.minPrice) / priceRange) * height) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // 3. 캔들 (pill body + wick)
      const risingCandles: Array<{
        x: number;
        bodyY: number;
        candleWidth: number;
        bodyHeight: number;
        wickY: number;
        wickHeight: number;
      }> = [];
      const fallingCandles: Array<{
        x: number;
        bodyY: number;
        candleWidth: number;
        bodyHeight: number;
        wickY: number;
        wickHeight: number;
      }> = [];

      visibleData.forEach((candle, i) => {
        const actualIndex = domain.index.startIndex + i;
        const pos = candleToPixels(candle, actualIndex, domain, range);

        const isRising = candle.close > candle.open;
        const candleWidth = pos.candleWidth * CANDLESTICK.BODY_WIDTH_RATIO;
        const x = pos.x + pos.candleWidth * CANDLESTICK.BODY_OFFSET_RATIO;

        const candleData = {
          x,
          bodyY: pos.bodyY,
          candleWidth,
          bodyHeight: Math.max(pos.bodyHeight, CANDLESTICK.MIN_BODY_HEIGHT),
          wickY: pos.highY,
          wickHeight: pos.wickHeight,
        };

        if (isRising) {
          risingCandles.push(candleData);
        } else {
          fallingCandles.push(candleData);
        }
      });

      // 상승 캔들 (검정)
      ctx.fillStyle = '#2D2D2D';
      ctx.strokeStyle = '#2D2D2D';
      ctx.lineWidth = CANDLESTICK.WICK_WIDTH;
      risingCandles.forEach((candle) => {
        // Wick
        ctx.beginPath();
        ctx.moveTo(candle.x + candle.candleWidth / 2, candle.wickY);
        ctx.lineTo(candle.x + candle.candleWidth / 2, candle.wickY + candle.wickHeight);
        ctx.stroke();
        // Body (pill)
        const radius = candle.candleWidth / 2;
        ctx.beginPath();
        ctx.roundRect(candle.x, candle.bodyY, candle.candleWidth, candle.bodyHeight, radius);
        ctx.fill();
      });

      // 하락 캔들 (회색 - 진한 톤)
      ctx.fillStyle = '#9A9A9A';
      ctx.strokeStyle = '#9A9A9A';
      fallingCandles.forEach((candle) => {
        // Wick
        ctx.beginPath();
        ctx.moveTo(candle.x + candle.candleWidth / 2, candle.wickY);
        ctx.lineTo(candle.x + candle.candleWidth / 2, candle.wickY + candle.wickHeight);
        ctx.stroke();
        // Body (pill)
        const radius = candle.candleWidth / 2;
        ctx.beginPath();
        ctx.roundRect(candle.x, candle.bodyY, candle.candleWidth, candle.bodyHeight, radius);
        ctx.fill();
      });
    });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [visibleData, domain, range, width, height]);

  return canvasRef;
};
