// src/hooks/useEditorCanvas.ts
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { chartDimensionsAtom } from '../stores/atoms/chartConfigAtoms';
import { chartDomainAtom } from '../stores/atoms/domainAtoms';
import {
  drawingObjectsAtom,
  draftObjectAtom,
  selectedObjectIdAtom,
} from '../stores/atoms/editorAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { IndexDomain, PriceDomain } from '../types/domain.types';
import { DrawingObject, HLineObject, TrendlineObject } from '../types/editor.types';
import { ChartRange } from '../types/range.types';
import { indexToPixel, priceToPixel } from '../utils/domainToRange';

interface EditorRenderCtx {
  indexDomain: IndexDomain;
  priceDomain: PriceDomain;
  range:       ChartRange;
  width:       number;
  height:      number;
}

const COLORS = {
  DEFAULT: '#2962FF',
  DRAFT_ALPHA: 0.5,
} as const;

const LINE_WIDTH = {
  NORMAL: 1.5,
} as const;

const HANDLE_RADIUS = 5;

export const useEditorCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef  = useRef<number | null>(null);

  const { width, height } = useAtomValue(chartDimensionsAtom);
  const domain            = useAtomValue(chartDomainAtom);
  const range             = useAtomValue(chartRangeAtom);
  const drawingObjects    = useAtomValue(drawingObjectsAtom);
  const draftObject       = useAtomValue(draftObjectAtom);
  const selectedId        = useAtomValue(selectedObjectIdAtom);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width  = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width  = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const renderCtx: EditorRenderCtx = {
        indexDomain: domain.index,
        priceDomain: domain.price,
        range,
        width,
        height,
      };

      drawingObjects.forEach((obj) => {
        renderObject(ctx, obj, obj.id === selectedId, false, renderCtx);
      });

      if (draftObject) {
        renderObject(ctx, draftObject, false, true, renderCtx);
      }
    });

    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [width, height, domain, range, drawingObjects, draftObject, selectedId]);

  return canvasRef;
};

// ─── 렌더링 헬퍼 ──────────────────────────────────────────────

function renderObject(
  ctx: CanvasRenderingContext2D,
  obj: DrawingObject,
  isSelected: boolean,
  isDraft: boolean,
  renderCtx: EditorRenderCtx,
) {
  const color     = COLORS.DEFAULT;
  const lineWidth = LINE_WIDTH.NORMAL;
  const alpha     = isDraft ? COLORS.DRAFT_ALPHA : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth   = lineWidth;

  if (obj.tool === 'hline') {
    renderHLine(ctx, obj, renderCtx, color, isSelected);
  } else if (obj.tool === 'trendline') {
    renderTrendline(ctx, obj, renderCtx, color, isSelected);
  }

  ctx.restore();
}

function renderHLine(
  ctx: CanvasRenderingContext2D,
  obj: HLineObject,
  { priceDomain, range, width, height }: EditorRenderCtx,
  color: string,
  isSelected: boolean,
) {
  const y = priceToPixel(obj.price, priceDomain, range);
  if (y < 0 || y > height) return;

  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = '10px sans-serif';
  ctx.fillText(obj.price.toFixed(2), 4, y - 3);

  if (isSelected) {
    drawHandle(ctx, 0, y, color);
    drawHandle(ctx, width, y, color);
  }
}

function renderTrendline(
  ctx: CanvasRenderingContext2D,
  obj: TrendlineObject,
  { indexDomain, priceDomain, range }: EditorRenderCtx,
  color: string,
  isSelected: boolean,
) {
  const candleWidth   = range.width / (indexDomain.endIndex - indexDomain.startIndex);
  const centerOffset  = candleWidth * 0.5;
  const x1 = indexToPixel(obj.p1.index, indexDomain, range) + centerOffset;
  const y1 = priceToPixel(obj.p1.price, priceDomain, range);
  const x2 = indexToPixel(obj.p2.index, indexDomain, range) + centerOffset;
  const y2 = priceToPixel(obj.p2.price, priceDomain, range);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (isSelected) {
    drawHandle(ctx, x1, y1, color);
    drawHandle(ctx, x2, y2, color);
  }
}

function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
