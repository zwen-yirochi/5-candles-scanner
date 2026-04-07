// src/hooks/useEditorInteraction.ts
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useRef } from 'react';
import { rawDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom } from '../stores/atoms/domainAtoms';
import {
  activeToolAtom,
  contextMenuPositionAtom,
  drawingObjectsAtom,
  draftObjectAtom,
  editorModeAtom,
  magnetEnabledAtom,
  selectedObjectIdAtom,
} from '../stores/atoms/editorAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { CandleData } from '../types/candle.types';
import { IndexDomain, PriceDomain } from '../types/domain.types';
import { DrawingObject, HLineObject, TrendlineObject } from '../types/editor.types';
import { ChartRange } from '../types/range.types';
import {
  indexToPixel,
  pixelToFloatIndex,
  pixelToPrice,
  priceToPixel,
} from '../utils/domainToRange';
import { snapToMagnet } from '../utils/editorMagnet';

const HIT_TOLERANCE = 8;
const HANDLE_HIT_RADIUS = 12;

function generateId() {
  return `obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function distanceToHLine(
  y: number,
  obj: HLineObject,
  domain: { price: PriceDomain },
  range: ChartRange,
): number {
  const lineY = priceToPixel(obj.price, domain.price, range);
  return Math.abs(y - lineY);
}

function distanceToTrendline(
  px: number,
  py: number,
  obj: TrendlineObject,
  domain: { index: IndexDomain; price: PriceDomain },
  range: ChartRange,
): number {
  const candleWidth  = range.width / (domain.index.endIndex - domain.index.startIndex);
  const centerOffset = candleWidth * 0.5;
  const x1 = indexToPixel(obj.p1.index, domain.index, range) + centerOffset;
  const y1 = priceToPixel(obj.p1.price, domain.price, range);
  const x2 = indexToPixel(obj.p2.index, domain.index, range) + centerOffset;
  const y2 = priceToPixel(obj.p2.price, domain.price, range);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function findHitObject(
  px: number,
  py: number,
  objects: DrawingObject[],
  domain: { index: IndexDomain; price: PriceDomain },
  range: ChartRange,
): DrawingObject | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    let dist = Infinity;
    if (obj.tool === 'hline') {
      dist = distanceToHLine(py, obj, domain, range);
    } else if (obj.tool === 'trendline') {
      dist = distanceToTrendline(px, py, obj, domain, range);
    }
    if (dist <= HIT_TOLERANCE) return obj;
  }
  return null;
}

export const useEditorInteraction = () => {
  const [editorMode, setEditorMode]        = useAtom(editorModeAtom);
  const [activeTool, setActiveTool]        = useAtom(activeToolAtom);
  const [selectedId, setSelectedId]        = useAtom(selectedObjectIdAtom);
  const setDrawingObjects                  = useSetAtom(drawingObjectsAtom);
  const [draftObject, setDraftObject]      = useAtom(draftObjectAtom);
  const setContextMenuPosition             = useSetAtom(contextMenuPositionAtom);
  const domain                             = useAtomValue(chartDomainAtom);
  const range                              = useAtomValue(chartRangeAtom);
  const candles                            = useAtomValue(rawDataAtom);
  const magnetEnabled                      = useAtomValue(magnetEnabledAtom);

  const editorModeRef    = useRef(editorMode);
  const activeToolRef    = useRef(activeTool);
  const selectedIdRef    = useRef(selectedId);
  const draftObjectRef   = useRef(draftObject);
  const domainRef        = useRef(domain);
  const rangeRef         = useRef(range);
  const candlesRef       = useRef(candles);
  const magnetEnabledRef = useRef(magnetEnabled);

  editorModeRef.current    = editorMode;
  activeToolRef.current    = activeTool;
  selectedIdRef.current    = selectedId;
  draftObjectRef.current   = draftObject;
  domainRef.current        = domain;
  rangeRef.current         = range;
  candlesRef.current       = candles;
  magnetEnabledRef.current = magnetEnabled;

  const dragStartRef      = useRef<{ x: number; y: number } | null>(null);
  const draggingHandleRef = useRef<'p1' | 'p2' | 'body' | null>(null);
  const drawingObjectsRef = useRef<DrawingObject[]>([]);

  const getEventPos = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const applyMagnet = useCallback((
    pixelX: number,
    pixelY: number,
    d: typeof domain,
    r: typeof range,
    c: CandleData[],
  ): { floatIndex: number; price: number } => {
    const mag = magnetEnabledRef.current
      ? snapToMagnet(pixelX, pixelY, c, d, r)
      : null;
    return {
      floatIndex: mag ? mag.index : pixelToFloatIndex(pixelX, d.index, r),
      price:      mag ? mag.price : pixelToPrice(pixelY, d.price, r),
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const mode = editorModeRef.current;
    const tool = activeToolRef.current;
    const d    = domainRef.current;
    const r    = rangeRef.current;
    const c    = candlesRef.current;

    if (mode === 'pan') return;

    if (mode === 'select') {
      const pos = getEventPos(e);
      const hit = findHitObject(pos.x, pos.y, drawingObjectsRef.current, d, r);

      if (!hit) {
        setSelectedId(null);
        setEditorMode('pan');
        setContextMenuPosition(null);
        return;
      }

      e.stopPropagation();
      setSelectedId(hit.id);

      draggingHandleRef.current = 'body';
      if (hit.tool === 'trendline') {
        const tObj = hit as TrendlineObject;
        const candleWidth  = r.width / (d.index.endIndex - d.index.startIndex);
        const centerOffset = candleWidth * 0.5;
        const hx1 = indexToPixel(tObj.p1.index, d.index, r) + centerOffset;
        const hy1 = priceToPixel(tObj.p1.price, d.price, r);
        const hx2 = indexToPixel(tObj.p2.index, d.index, r) + centerOffset;
        const hy2 = priceToPixel(tObj.p2.price, d.price, r);
        if (Math.hypot(pos.x - hx1, pos.y - hy1) <= HANDLE_HIT_RADIUS) {
          draggingHandleRef.current = 'p1';
        } else if (Math.hypot(pos.x - hx2, pos.y - hy2) <= HANDLE_HIT_RADIUS) {
          draggingHandleRef.current = 'p2';
        }
      }

      dragStartRef.current = pos;
      return;
    }

    // draw 모드
    e.stopPropagation();
    const pos = getEventPos(e);

    if (mode === 'draw') {
      if (tool === 'hline') {
        const { price } = applyMagnet(pos.x, pos.y, d, r, c);
        const newObj: HLineObject = {
          id: generateId(), tool: 'hline', selected: false, color: '#2962FF', price,
        };
        setDrawingObjects((prev) => [...prev, newObj]);
        setActiveTool('none');
        setEditorMode('pan');

      } else if (tool === 'trendline') {
        const draft = draftObjectRef.current as TrendlineObject | null;
        const { floatIndex, price } = applyMagnet(pos.x, pos.y, d, r, c);

        if (!draft) {
          const newDraft: TrendlineObject = {
            id: generateId(), tool: 'trendline', selected: false, color: '#2962FF',
            p1: { index: floatIndex, price },
            p2: { index: floatIndex, price },
          };
          setDraftObject(newDraft);
        } else {
          const finalObj: TrendlineObject = {
            ...draft,
            p2: { index: floatIndex, price },
          };
          setDrawingObjects((prev) => [...prev, finalObj]);
          setDraftObject(null);
          setActiveTool('none');
          setEditorMode('pan');
        }
      }
    }
  }, [setDrawingObjects, setActiveTool, setEditorMode, setDraftObject, setSelectedId, setContextMenuPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const mode = editorModeRef.current;
    const tool = activeToolRef.current;
    const d    = domainRef.current;
    const r    = rangeRef.current;
    const c    = candlesRef.current;

    if (mode === 'draw' && tool === 'trendline') {
      const draft = draftObjectRef.current as TrendlineObject | null;
      if (draft) {
        const pos = getEventPos(e);
        const { floatIndex, price } = applyMagnet(pos.x, pos.y, d, r, c);
        setDraftObject({ ...draft, p2: { index: floatIndex, price } });
      }
    }

    if (mode === 'select' && dragStartRef.current && selectedIdRef.current) {
      const pos    = getEventPos(e);
      const dx     = pos.x - dragStartRef.current.x;
      const dy     = pos.y - dragStartRef.current.y;
      dragStartRef.current = pos;
      const handle = draggingHandleRef.current;

      if (handle === 'p1' || handle === 'p2') {
        const { floatIndex, price } = applyMagnet(pos.x, pos.y, d, r, c);
        setDrawingObjects((prev) =>
          prev.map((obj) => {
            if (obj.id !== selectedIdRef.current || obj.tool !== 'trendline') return obj;
            return { ...obj, [handle]: { index: floatIndex, price } };
          }),
        );
      } else {
        // 전체 이동: delta 기반 (마그넷 미적용)
        const priceDelta = -(dy / r.height) * (d.price.maxPrice - d.price.minPrice);
        const indexDelta = (dx / r.width) * (d.index.endIndex - d.index.startIndex);
        setDrawingObjects((prev) =>
          prev.map((obj) => {
            if (obj.id !== selectedIdRef.current) return obj;
            if (obj.tool === 'hline') {
              return { ...obj, price: obj.price + priceDelta };
            }
            if (obj.tool === 'trendline') {
              const tObj = obj as TrendlineObject;
              return {
                ...tObj,
                p1: { index: tObj.p1.index + indexDelta, price: tObj.p1.price + priceDelta },
                p2: { index: tObj.p2.index + indexDelta, price: tObj.p2.price + priceDelta },
              };
            }
            return obj;
          }),
        );
      }
    }
  }, [setDraftObject, setDrawingObjects]);

  const handlePointerUp = useCallback((_e: React.PointerEvent) => {
    dragStartRef.current = null;
    draggingHandleRef.current = null;
  }, []);

  const syncDrawingObjects = useCallback((objs: DrawingObject[]) => {
    drawingObjectsRef.current = objs;
  }, []);

  const handlePanModeClick = useCallback((e: React.PointerEvent) => {
    if (editorModeRef.current !== 'pan') return;
    const pos = getEventPos(e);
    const hit = findHitObject(
      pos.x, pos.y,
      drawingObjectsRef.current,
      domainRef.current,
      rangeRef.current,
    );
    if (hit) {
      e.stopPropagation();
      setSelectedId(hit.id);
      setEditorMode('select');
      setContextMenuPosition({ x: pos.x, y: pos.y });
    } else {
      setSelectedId(null);
      setContextMenuPosition(null);
    }
  }, [setSelectedId, setEditorMode, setContextMenuPosition]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePanModeClick,
    syncDrawingObjects,
    isDrawMode: editorMode === 'draw',
    isSelectMode: editorMode === 'select',
  };
};
