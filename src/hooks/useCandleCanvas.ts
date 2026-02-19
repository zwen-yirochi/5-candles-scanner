import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { CANDLESTICK } from '../constants/chart.constants';
import { chartDimensionsAtom } from '../stores/atoms/chartConfigAtoms';
import { visibleDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom } from '../stores/atoms/domainAtoms';
import { displayZonesAtom } from '../stores/atoms/patternAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { DisplayZone } from '../types/pattern.types';
import { candleToPixels, indexToPixel, priceToPixel } from '../utils/domainToRange';
import { getVisiblePriceLabels } from '../utils/priceLabel';
import { TIMEFRAME_LABELS, ZONE_COLORS } from '../utils/timeframeColors';

export const useCandleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef = useRef<number | null>(null);

  const visibleData = useAtomValue(visibleDataAtom);
  const domain = useAtomValue(chartDomainAtom);
  const range = useAtomValue(chartRangeAtom);
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const displayZones = useAtomValue(displayZonesAtom);

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
      ctx.strokeStyle = '#D5D5D0';
      ctx.lineWidth = 1;
      labels.forEach((price) => {
        const y = Math.round(height - ((price - domain.price.minPrice) / priceRange) * height) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // 3. Zone 영역 (캔들 뒤에 렌더링)
      renderZones(ctx, displayZones, domain, range, width, height);

      // 4. 캔들 (pill body + wick)
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
  }, [visibleData, domain, range, width, height, displayZones]);

  return canvasRef;
};

function renderZones(
  ctx: CanvasRenderingContext2D,
  zones: DisplayZone[],
  domain: { index: { startIndex: number; endIndex: number }; price: { minPrice: number; maxPrice: number } },
  range: { width: number; height: number },
  viewportWidth: number,
  viewportHeight: number
) {
  if (zones.length === 0) return;

  const visibleStart = domain.index.startIndex;
  const visibleEnd = domain.index.endIndex;

  // 15m→30m→1h→4h 순서로 렌더링 (4h가 가장 위)
  const tfOrder: Array<'15m' | '30m' | '1h' | '4h'> = ['15m', '30m', '1h', '4h'];
  const sorted = [...zones].sort((a, b) => {
    return tfOrder.indexOf(a.zone.timeframe) - tfOrder.indexOf(b.zone.timeframe);
  });

  for (const dz of sorted) {
    const { zone, chartStartIndex, chartEndIndex } = dz;

    // zone 끝 인덱스: 활성이면 차트 오른쪽 끝, 돌파면 돌파 시점
    const zoneEndIdx = chartEndIndex ?? visibleEnd + 5;

    // 뷰포트 밖 zone 스킵
    if (zoneEndIdx < visibleStart || chartStartIndex > visibleEnd) continue;

    const colors = ZONE_COLORS[zone.timeframe];

    // X 좌표
    const x1 = Math.max(0, indexToPixel(chartStartIndex, domain.index, range));
    const x2 = chartEndIndex !== null
      ? Math.min(viewportWidth, indexToPixel(chartEndIndex, domain.index, range))
      : viewportWidth;
    const zoneWidth = x2 - x1;
    if (zoneWidth <= 0) continue;

    // Y 좌표
    const y1 = priceToPixel(zone.zoneTop, domain.price, range);
    const y2 = priceToPixel(zone.zoneBottom, domain.price, range);
    const zoneHeight = Math.max(y2 - y1, 2); // 도지 캔들: 최소 2px

    // 배경
    ctx.fillStyle = zone.isActive ? colors.bg : colors.bgBroken;
    ctx.fillRect(x1, y1, zoneWidth, zoneHeight);

    // 테두리 (점선)
    ctx.strokeStyle = zone.isActive ? colors.border : colors.bgBroken;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x1 + 0.5, y1 + 0.5, zoneWidth - 1, zoneHeight - 1);
    ctx.setLineDash([]);

    // TF 라벨 — zone 높이가 14px 이상일 때만
    if (zoneHeight >= 14) {
      const visibleX1 = Math.max(x1, 0);
      const visibleX2 = Math.min(x2, viewportWidth);
      const labelX = visibleX1 + (visibleX2 - visibleX1) / 2;
      const labelY = y1 + zoneHeight / 2;

      ctx.fillStyle = colors.label;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(TIMEFRAME_LABELS[zone.timeframe], labelX, labelY);
    }
  }
}
