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
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);

      // 2. Grid Lines
      const { labels } = getVisiblePriceLabels(domain.price.minPrice, domain.price.maxPrice, 10);
      const priceRange = domain.price.maxPrice - domain.price.minPrice;
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      labels.forEach((price) => {
        const y = Math.round(height - ((price - domain.price.minPrice) / priceRange) * height) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // 3. 캔들
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

      visibleData.forEach((candle, i) => {
        const actualIndex = domain.index.startIndex + i;
        const pos = candleToPixels(candle, actualIndex, domain, range);

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
  }, [visibleData, domain, range, width, height]);

  return canvasRef;
};
