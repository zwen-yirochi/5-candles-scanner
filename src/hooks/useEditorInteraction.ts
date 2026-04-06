// src/hooks/useEditorInteraction.ts
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useRef } from 'react';
import { rawDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom } from '../stores/atoms/domainAtoms';
import {
  activeToolAtom,
  drawingObjectsAtom,
  draftObjectAtom,
  editorModeAtom,
  selectedObjectIdAtom,
} from '../stores/atoms/editorAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { CandleData } from '../types/candle.types';
import { DrawingObject, HLineObject, TrendlineObject } from '../types/editor.types';
import {
  indexToPixel,
  indexToTimestamp,
  pixelToIndex,
  pixelToPrice,
  priceToPixel,
  timestampToIndex,
} from '../utils/domainToRange';

const HIT_TOLERANCE = 8;
const HANDLE_HIT_RADIUS = 12; // 핸들 탭 허용 반경 (렌더 반경 5px보다 크게)

function generateId() {
  return `obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function distanceToHLine(
  y: number,
  obj: HLineObject,
  domain: { price: { minPrice: number; maxPrice: number } },
  range: { width: number; height: number },
): number {
  const lineY = priceToPixel(obj.price, domain.price, range);
  return Math.abs(y - lineY);
}

function distanceToTrendline(
  px: number,
  py: number,
  obj: TrendlineObject,
  domain: { index: { startIndex: number; endIndex: number }; price: { minPrice: number; maxPrice: number } },
  range: { width: number; height: number },
  candles: CandleData[],
): number {
  const i1 = timestampToIndex(obj.p1.timestamp, candles);
  const i2 = timestampToIndex(obj.p2.timestamp, candles);
  const candleWidth = range.width / (domain.index.endIndex - domain.index.startIndex);
  const centerOffset = candleWidth * 0.5;
  const x1 = indexToPixel(i1, domain.index, range) + centerOffset;
  const y1 = priceToPixel(obj.p1.price, domain.price, range);
  const x2 = indexToPixel(i2, domain.index, range) + centerOffset;
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
  domain: { index: { startIndex: number; endIndex: number }; price: { minPrice: number; maxPrice: number } },
  range: { width: number; height: number },
  candles: CandleData[],
): DrawingObject | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    let dist = Infinity;
    if (obj.tool === 'hline') {
      dist = distanceToHLine(py, obj, domain, range);
    } else if (obj.tool === 'trendline') {
      dist = distanceToTrendline(px, py, obj, domain, range, candles);
    }
    if (dist <= HIT_TOLERANCE) return obj;
  }
  return null;
}

export const useEditorInteraction = () => {
  const [editorMode, setEditorMode]   = useAtom(editorModeAtom);
  const [activeTool, setActiveTool]   = useAtom(activeToolAtom);
  const [selectedId, setSelectedId]   = useAtom(selectedObjectIdAtom);
  const setDrawingObjects             = useSetAtom(drawingObjectsAtom);
  const [draftObject, setDraftObject] = useAtom(draftObjectAtom);
  const domain                        = useAtomValue(chartDomainAtom);
  const range                         = useAtomValue(chartRangeAtom);
  const candles                       = useAtomValue(rawDataAtom);

  const editorModeRef  = useRef(editorMode);
  const activeToolRef  = useRef(activeTool);
  const selectedIdRef  = useRef(selectedId);
  const draftObjectRef = useRef(draftObject);
  const domainRef      = useRef(domain);
  const rangeRef       = useRef(range);
  const candlesRef     = useRef(candles);

  editorModeRef.current  = editorMode;
  activeToolRef.current  = activeTool;
  selectedIdRef.current  = selectedId;
  draftObjectRef.current = draftObject;
  domainRef.current      = domain;
  rangeRef.current       = range;
  candlesRef.current     = candles;

  const dragStartRef      = useRef<{ x: number; y: number } | null>(null);
  const draggingHandleRef = useRef<'p1' | 'p2' | 'body' | null>(null);
  const drawingObjectsRef = useRef<DrawingObject[]>([]);

  const getEventPos = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const mode = editorModeRef.current;
    const tool = activeToolRef.current;
    const d    = domainRef.current;
    const r    = rangeRef.current;
    const c    = candlesRef.current;

    if (mode === 'pan') return;

    if (mode === 'select') {
      const pos = getEventPos(e);
      const hit = findHitObject(pos.x, pos.y, drawingObjectsRef.current, d, r, c);

      if (!hit) {
        // 빈 영역 클릭 → 선택 취소하고 pan으로 복귀 (pan 이벤트는 통과)
        setSelectedId(null);
        setEditorMode('pan');
        return;
      }

      e.stopPropagation();
      setSelectedId(hit.id);

      // 추세선 끝점 핸들 감지
      draggingHandleRef.current = 'body';
      if (hit.tool === 'trendline') {
        const tObj = hit as TrendlineObject;
        const candleWidth = r.width / (d.index.endIndex - d.index.startIndex);
        const centerOffset = candleWidth * 0.5;
        const i1 = timestampToIndex(tObj.p1.timestamp, c);
        const i2 = timestampToIndex(tObj.p2.timestamp, c);
        const hx1 = indexToPixel(i1, d.index, r) + centerOffset;
        const hy1 = priceToPixel(tObj.p1.price, d.price, r);
        const hx2 = indexToPixel(i2, d.index, r) + centerOffset;
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
        const price = pixelToPrice(pos.y, d.price, r);
        const newObj: HLineObject = {
          id: generateId(), tool: 'hline', selected: false, color: '#2962FF', price,
        };
        setDrawingObjects((prev) => [...prev, newObj]);
        setActiveTool('none');
        setEditorMode('pan');

      } else if (tool === 'trendline') {
        const draft = draftObjectRef.current as TrendlineObject | null;

        if (!draft) {
          const index     = pixelToIndex(pos.x, d.index, r);
          const timestamp = indexToTimestamp(index, c);
          const price     = pixelToPrice(pos.y, d.price, r);
          const newDraft: TrendlineObject = {
            id: generateId(), tool: 'trendline', selected: false, color: '#2962FF',
            p1: { timestamp, price },
            p2: { timestamp, price },
          };
          setDraftObject(newDraft);
        } else {
          const index     = pixelToIndex(pos.x, d.index, r);
          const timestamp = indexToTimestamp(index, c);
          const price     = pixelToPrice(pos.y, d.price, r);
          const finalObj: TrendlineObject = {
            ...draft,
            p2: { timestamp, price },
          };
          setDrawingObjects((prev) => [...prev, finalObj]);
          setDraftObject(null);
          setActiveTool('none');
          setEditorMode('pan');
        }
      }
    }
  }, [setDrawingObjects, setActiveTool, setEditorMode, setDraftObject, setSelectedId]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const mode = editorModeRef.current;
    const tool = activeToolRef.current;
    const d    = domainRef.current;
    const r    = rangeRef.current;
    const c    = candlesRef.current;

    // 추세선 draft 미리보기
    if (mode === 'draw' && tool === 'trendline') {
      const draft = draftObjectRef.current as TrendlineObject | null;
      if (draft) {
        const pos       = getEventPos(e);
        const index     = pixelToIndex(pos.x, d.index, r);
        const timestamp = indexToTimestamp(index, c);
        const price     = pixelToPrice(pos.y, d.price, r);
        setDraftObject({ ...draft, p2: { timestamp, price } });
      }
    }

    if (mode === 'select' && dragStartRef.current && selectedIdRef.current) {
      const pos    = getEventPos(e);
      const dx     = pos.x - dragStartRef.current.x;
      const dy     = pos.y - dragStartRef.current.y;
      dragStartRef.current = pos;
      const handle = draggingHandleRef.current;

      if (handle === 'p1' || handle === 'p2') {
        // 끝점만 현재 포인터 위치로 이동
        const index     = pixelToIndex(pos.x, d.index, r);
        const timestamp = indexToTimestamp(index, c);
        const price     = pixelToPrice(pos.y, d.price, r);
        setDrawingObjects((prev) =>
          prev.map((obj) => {
            if (obj.id !== selectedIdRef.current || obj.tool !== 'trendline') return obj;
            return { ...obj, [handle]: { timestamp, price } };
          }),
        );
      } else {
        // 전체 이동 (delta 기반)
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
              const newI1 = timestampToIndex(tObj.p1.timestamp, c) + indexDelta;
              const newI2 = timestampToIndex(tObj.p2.timestamp, c) + indexDelta;
              return {
                ...tObj,
                p1: { timestamp: indexToTimestamp(Math.round(newI1), c), price: tObj.p1.price + priceDelta },
                p2: { timestamp: indexToTimestamp(Math.round(newI2), c), price: tObj.p2.price + priceDelta },
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
      candlesRef.current,
    );
    if (hit) {
      e.stopPropagation();
      setSelectedId(hit.id);
      setEditorMode('select');
    } else {
      setSelectedId(null);
    }
  }, [setSelectedId, setEditorMode]);

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
