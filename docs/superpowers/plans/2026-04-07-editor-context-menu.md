# Editor Context Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 선택된 드로잉 객체 클릭 위치에 플로팅 컨텍스트 메뉴를 표시하고, 추세선의 좌우 연장 토글과 삭제 기능을 제공한다.

**Architecture:** `editorContextActions.ts` 레지스트리가 툴별 액션을 선언하고, `EditorContextMenu` 컴포넌트는 순수 렌더러로 동작한다. `contextMenuPositionAtom`이 클릭 위치를 관리하며, `TrendlineObject`의 `extendLeft/Right` 플래그를 렌더링 시 확인해 slope를 따라 차트 끝까지 연장선을 그린다. 새 드로잉 툴 추가 시 레지스트리에만 등록하면 된다.

**Tech Stack:** React 19, TypeScript, Jotai, Tailwind CSS, Canvas 2D API

---

## 파일 구조

| 파일 | 변경 유형 | 역할 |
|---|---|---|
| `src/types/editor.types.ts` | 수정 | TrendlineObject에 extendLeft/Right 추가 |
| `src/stores/atoms/editorAtoms.ts` | 수정 | contextMenuPositionAtom 추가 |
| `src/config/editorContextActions.ts` | 신규 | ContextMenuAction 타입 + CONTEXT_ACTIONS 레지스트리 |
| `src/config/editorContextActions.test.ts` | 신규 | 레지스트리 테스트 |
| `src/hooks/useEditorCanvas.ts` | 수정 | extendLeft/Right 렌더링 |
| `src/hooks/useEditorInteraction.ts` | 수정 | handlePanModeClick/handlePointerDown에 contextMenuPosition 설정 |
| `src/components/Chart/EditorContextMenu.tsx` | 신규 | 컨텍스트 메뉴 컴포넌트 |
| `src/components/Chart/ChartEditorToolbar.tsx` | 수정 | Delete 버튼 제거 |
| `src/components/Chart/ChartArea.tsx` | 수정 | EditorContextMenu 렌더링 |
| `src/components/Chart/EditorFloatingDelete.tsx` | 삭제 | — |

---

## Task 1: 타입 & Atom 기반 추가

**Files:**
- Modify: `src/types/editor.types.ts`
- Modify: `src/stores/atoms/editorAtoms.ts`

- [ ] **Step 1: TrendlineObject에 extendLeft/Right 추가**

`src/types/editor.types.ts`의 `TrendlineObject` 인터페이스를 아래로 교체:

```typescript
export interface TrendlineObject extends BaseDrawingObject {
  tool: 'trendline';
  p1: { index: number; price: number };
  p2: { index: number; price: number };
  extendLeft?: boolean;   // true = p1 방향으로 차트 왼쪽 끝까지 연장
  extendRight?: boolean;  // true = p2 방향으로 차트 오른쪽 끝까지 연장
}
```

- [ ] **Step 2: contextMenuPositionAtom 추가**

`src/stores/atoms/editorAtoms.ts` 파일 맨 아래에 추가:

```typescript
// 컨텍스트 메뉴 표시 좌표 (null = 닫힘)
export const contextMenuPositionAtom = atom<{ x: number; y: number } | null>(null);
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "^npm warn"
```

Expected: 출력 없음 (extendLeft/Right는 optional이므로 기존 코드 영향 없음)

- [ ] **Step 4: 커밋**

```bash
git add src/types/editor.types.ts src/stores/atoms/editorAtoms.ts
git commit -m "feat(editor): TrendlineObject extendLeft/Right 추가, contextMenuPositionAtom 추가"
```

---

## Task 2: editorContextActions 레지스트리

**Files:**
- Create: `src/config/editorContextActions.ts`
- Create: `src/config/editorContextActions.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`src/config/editorContextActions.test.ts` 파일을 새로 생성:

```typescript
import { HLineObject, TrendlineObject } from '../types/editor.types';
import { CONTEXT_ACTIONS } from './editorContextActions';

const mockHLine: HLineObject = {
  id: 'h1', tool: 'hline', selected: false, color: '#2962FF', price: 100,
};

const mockTrendline: TrendlineObject = {
  id: 't1', tool: 'trendline', selected: false, color: '#2962FF',
  p1: { index: 0, price: 100 },
  p2: { index: 5, price: 110 },
};

describe('CONTEXT_ACTIONS', () => {
  describe('hline', () => {
    it('delete 액션만 있다', () => {
      expect(CONTEXT_ACTIONS.hline).toHaveLength(1);
      expect(CONTEXT_ACTIONS.hline[0].id).toBe('delete');
    });

    it('delete onAction은 null을 반환한다', () => {
      const del = CONTEXT_ACTIONS.hline.find((a) => a.id === 'delete')!;
      expect(del.onAction(mockHLine)).toBeNull();
    });
  });

  describe('trendline', () => {
    it('extendLeft, extendRight, delete 순서로 3개 액션이 있다', () => {
      const ids = CONTEXT_ACTIONS.trendline.map((a) => a.id);
      expect(ids).toEqual(['extendLeft', 'extendRight', 'delete']);
    });

    it('extendLeft 토글: false → true', () => {
      const action = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'extendLeft')!;
      const result = action.onAction({ ...mockTrendline, extendLeft: false }) as TrendlineObject;
      expect(result.extendLeft).toBe(true);
    });

    it('extendLeft 토글: true → false', () => {
      const action = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'extendLeft')!;
      const result = action.onAction({ ...mockTrendline, extendLeft: true }) as TrendlineObject;
      expect(result.extendLeft).toBe(false);
    });

    it('extendRight 토글: false → true', () => {
      const action = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'extendRight')!;
      const result = action.onAction({ ...mockTrendline, extendRight: false }) as TrendlineObject;
      expect(result.extendRight).toBe(true);
    });

    it('extendLeft isActive: undefined/false → false, true → true', () => {
      const action = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'extendLeft')!;
      expect(action.isActive!({ ...mockTrendline })).toBe(false);
      expect(action.isActive!({ ...mockTrendline, extendLeft: false })).toBe(false);
      expect(action.isActive!({ ...mockTrendline, extendLeft: true })).toBe(true);
    });

    it('extendRight isActive: undefined → false, true → true', () => {
      const action = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'extendRight')!;
      expect(action.isActive!({ ...mockTrendline })).toBe(false);
      expect(action.isActive!({ ...mockTrendline, extendRight: true })).toBe(true);
    });

    it('delete onAction은 null을 반환한다', () => {
      const del = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'delete')!;
      expect(del.onAction(mockTrendline)).toBeNull();
    });
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- --watchAll=false --testPathPattern=editorContextActions
```

Expected: `Cannot find module './editorContextActions'` 에러

- [ ] **Step 3: editorContextActions.ts 구현**

`src/config/editorContextActions.ts` 파일을 새로 생성:

```typescript
// src/config/editorContextActions.ts
import { ActiveToolType, DrawingObject, TrendlineObject } from '../types/editor.types';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: string;
  type: 'button' | 'toggle';
  /** toggle 타입일 때 활성 상태 판단 */
  isActive?: (obj: DrawingObject) => boolean;
  /** DrawingObject 반환 = 업데이트, null 반환 = 삭제 */
  onAction: (obj: DrawingObject) => DrawingObject | null;
}

const extendLeftAction: ContextMenuAction = {
  id: 'extendLeft',
  label: '왼쪽 연장',
  icon: '←',
  type: 'toggle',
  isActive: (obj) => !!(obj as TrendlineObject).extendLeft,
  onAction: (obj) => {
    const t = obj as TrendlineObject;
    return { ...t, extendLeft: !t.extendLeft };
  },
};

const extendRightAction: ContextMenuAction = {
  id: 'extendRight',
  label: '오른쪽 연장',
  icon: '→',
  type: 'toggle',
  isActive: (obj) => !!(obj as TrendlineObject).extendRight,
  onAction: (obj) => {
    const t = obj as TrendlineObject;
    return { ...t, extendRight: !t.extendRight };
  },
};

const deleteAction: ContextMenuAction = {
  id: 'delete',
  label: '삭제',
  icon: '🗑',
  type: 'button',
  onAction: () => null,
};

export const CONTEXT_ACTIONS: Record<ActiveToolType, ContextMenuAction[]> = {
  hline:     [deleteAction],
  trendline: [extendLeftAction, extendRightAction, deleteAction],
};
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

```bash
npm test -- --watchAll=false --testPathPattern=editorContextActions
```

Expected: 9개 테스트 모두 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/config/editorContextActions.ts src/config/editorContextActions.test.ts
git commit -m "feat(editor): ContextMenuAction 레지스트리 추가 (extendLeft/Right/delete)"
```

---

## Task 3: 추세선 연장 렌더링

**Files:**
- Modify: `src/hooks/useEditorCanvas.ts`

`renderTrendline` 함수에서 `extendLeft/Right` 플래그를 확인해 slope를 따라 차트 끝까지 연장한다. 핸들은 항상 원래 끝점(p1, p2)에 표시한다.

- [ ] **Step 1: renderTrendline 함수 교체**

`src/hooks/useEditorCanvas.ts`의 `renderTrendline` 함수 전체를 아래로 교체:

```typescript
function renderTrendline(
  ctx: CanvasRenderingContext2D,
  obj: TrendlineObject,
  { indexDomain, priceDomain, range }: EditorRenderCtx,
  color: string,
  isSelected: boolean,
) {
  const candleWidth  = range.width / (indexDomain.endIndex - indexDomain.startIndex);
  const centerOffset = candleWidth * 0.5;
  const x1 = indexToPixel(obj.p1.index, indexDomain, range) + centerOffset;
  const y1 = priceToPixel(obj.p1.price, priceDomain, range);
  const x2 = indexToPixel(obj.p2.index, indexDomain, range) + centerOffset;
  const y2 = priceToPixel(obj.p2.price, priceDomain, range);

  const dx = x2 - x1;
  const dy = y2 - y1;

  // 연장 좌표 계산 (slope 유지)
  let startX = x1;
  let startY = y1;
  let endX   = x2;
  let endY   = y2;

  if (dx !== 0) {
    const slope = dy / dx;
    if (obj.extendLeft) {
      startX = 0;
      startY = y1 + slope * (0 - x1);
    }
    if (obj.extendRight) {
      endX = range.width;
      endY = y1 + slope * (range.width - x1);
    }
  }

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // 핸들은 항상 원래 끝점에 표시
  if (isSelected) {
    drawHandle(ctx, x1, y1, color);
    drawHandle(ctx, x2, y2, color);
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "^npm warn"
```

Expected: 출력 없음

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useEditorCanvas.ts
git commit -m "feat(editor): 추세선 extendLeft/Right 연장 렌더링 추가"
```

---

## Task 4: useEditorInteraction에 contextMenuPosition 연동

**Files:**
- Modify: `src/hooks/useEditorInteraction.ts`

`handlePanModeClick` (pan 모드에서 객체 선택)과 `handlePointerDown` (select 모드에서 빈 영역 클릭 해제) 두 곳에서 `contextMenuPositionAtom`을 업데이트한다.

현재 `src/hooks/useEditorInteraction.ts`의 전체 내용을 아래로 교체:

- [ ] **Step 1: useEditorInteraction.ts 전체 교체**

```typescript
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
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "^npm warn"
```

Expected: 출력 없음

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useEditorInteraction.ts
git commit -m "feat(editor): handlePanModeClick/handlePointerDown에 contextMenuPosition 연동"
```

---

## Task 5: EditorContextMenu 컴포넌트 + 통합

**Files:**
- Create: `src/components/Chart/EditorContextMenu.tsx`
- Modify: `src/components/Chart/ChartEditorToolbar.tsx`
- Modify: `src/components/Chart/ChartArea.tsx`
- Delete: `src/components/Chart/EditorFloatingDelete.tsx`

- [ ] **Step 1: EditorContextMenu.tsx 생성**

`src/components/Chart/EditorContextMenu.tsx`:

```typescript
// src/components/Chart/EditorContextMenu.tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, { useCallback } from 'react';
import { CONTEXT_ACTIONS } from '../../config/editorContextActions';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import {
  contextMenuPositionAtom,
  drawingObjectsAtom,
  editorModeAtom,
  selectedObjectIdAtom,
} from '../../stores/atoms/editorAtoms';

export const EditorContextMenu: React.FC = () => {
  const [selectedId, setSelectedId]            = useAtom(selectedObjectIdAtom);
  const [position, setPosition]                = useAtom(contextMenuPositionAtom);
  const setEditorMode                          = useSetAtom(editorModeAtom);
  const [drawingObjects, setDrawingObjects]    = useAtom(drawingObjectsAtom);
  const { width, height }                      = useAtomValue(chartDimensionsAtom);

  const selectedObj = drawingObjects.find((o) => o.id === selectedId) ?? null;

  const close = useCallback(() => {
    setSelectedId(null);
    setEditorMode('pan');
    setPosition(null);
  }, [setSelectedId, setEditorMode, setPosition]);

  if (!selectedId || !position || !selectedObj) return null;

  const actions    = CONTEXT_ACTIONS[selectedObj.tool];
  const MENU_WIDTH = 160;
  const ITEM_H     = 36;
  const menuHeight = actions.length * ITEM_H + 8;

  // 수평 clamp: 메뉴가 차트 밖으로 나가지 않도록
  const clampedX = Math.max(MENU_WIDTH / 2, Math.min(position.x, width - MENU_WIDTH / 2));
  // 수직 flip: 아래 공간이 부족하면 위에 표시
  const above = position.y + menuHeight > height;
  const top   = above ? position.y - menuHeight - 8 : position.y + 8;

  return (
    <div
      style={{
        position:  'absolute',
        left:      clampedX,
        top,
        transform: 'translateX(-50%)',
        zIndex:    30,
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-lg py-1"
      style={{ minWidth: `${MENU_WIDTH}px` }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {actions.map((action) => {
        const isActive =
          action.type === 'toggle' && action.isActive
            ? action.isActive(selectedObj)
            : false;

        return (
          <button
            key={action.id}
            onClick={() => {
              const result = action.onAction(selectedObj);
              if (result === null) {
                setDrawingObjects((prev) => prev.filter((o) => o.id !== selectedId));
                close();
              } else {
                setDrawingObjects((prev) =>
                  prev.map((o) => (o.id === selectedId ? result : o)),
                );
                if (action.type === 'button') close();
              }
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
              ${action.id === 'delete'
                ? 'text-red-600 hover:bg-red-50'
                : isActive
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <span className="text-base leading-none">{action.icon}</span>
            <span>{action.label}</span>
            {action.type === 'toggle' && (
              <span className="ml-auto text-xs text-gray-400">{isActive ? 'ON' : 'OFF'}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
```

> ⚠️ 위 코드에서 `style` prop이 두 개 중복 선언되어 있다 (`position`/`left`/`top`/`transform` 인라인과 `minWidth` 인라인). 두 개를 하나로 합쳐야 한다:
>
> ```tsx
> style={{
>   position:  'absolute',
>   left:      clampedX,
>   top,
>   transform: 'translateX(-50%)',
>   zIndex:    30,
>   minWidth:  `${MENU_WIDTH}px`,
> }}
> ```

- [ ] **Step 2: ChartEditorToolbar.tsx — Delete 버튼 제거**

`src/components/Chart/ChartEditorToolbar.tsx` 파일 전체를 아래로 교체:

```typescript
// src/components/Chart/ChartEditorToolbar.tsx
import { useAtom, useSetAtom } from 'jotai';
import React, { useCallback } from 'react';
import {
  activeToolAtom,
  draftObjectAtom,
  editorModeAtom,
  magnetEnabledAtom,
  selectedObjectIdAtom,
} from '../../stores/atoms/editorAtoms';
import { crosshairPositionAtom } from '../../stores/atoms/interactionAtoms';
import { ActiveToolType, ToolDefinition } from '../../types/editor.types';

const EDITOR_TOOLS: ToolDefinition[] = [
  { type: 'hline',     label: 'HLine' },
  { type: 'trendline', label: 'Trend' },
];

export const ChartEditorToolbar: React.FC = () => {
  const [activeTool, setActiveTool]       = useAtom(activeToolAtom);
  const [magnetEnabled, setMagnetEnabled] = useAtom(magnetEnabledAtom);
  const setEditorMode                     = useSetAtom(editorModeAtom);
  const setDraftObject                    = useSetAtom(draftObjectAtom);
  const setSelectedId                     = useSetAtom(selectedObjectIdAtom);
  const setCrosshairPosition              = useSetAtom(crosshairPositionAtom);

  const handlePan = useCallback(() => {
    setEditorMode('pan');
    setActiveTool('none');
    setDraftObject(null);
    setSelectedId(null);
  }, [setEditorMode, setActiveTool, setDraftObject, setSelectedId]);

  const handleToolSelect = useCallback((toolType: ActiveToolType) => {
    if (activeTool === toolType) {
      handlePan();
    } else {
      setActiveTool(toolType);
      setEditorMode('draw');
      setDraftObject(null);
      setSelectedId(null);
      setCrosshairPosition(null);
    }
  }, [activeTool, handlePan, setActiveTool, setEditorMode, setDraftObject, setSelectedId, setCrosshairPosition]);

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-[#F5F5F0] border-b border-[#D5D5D0]">
      {EDITOR_TOOLS.map((tool) => {
        const isActive = activeTool === tool.type;
        return (
          <button
            key={tool.type}
            onClick={() => handleToolSelect(tool.type)}
            className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium min-h-[36px] transition-colors
              ${isActive
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            <span>{tool.type === 'hline' ? '—' : '╱'}</span>
            <span>{tool.label}</span>
          </button>
        );
      })}

      <button
        onClick={() => setMagnetEnabled((v) => !v)}
        className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium min-h-[36px] transition-colors
          ${magnetEnabled
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        title="마그넷: OHLC 스냅"
      >
        <span>🧲</span>
        <span>Magnet</span>
      </button>
    </div>
  );
};
```

- [ ] **Step 3: ChartArea.tsx에 EditorContextMenu 추가**

`src/components/Chart/ChartArea.tsx`에서:

import 추가 (기존 import 블록 맨 아래):
```typescript
import { EditorContextMenu } from './EditorContextMenu';
```

JSX 내부 `{children}` 바로 뒤에 추가:
```tsx
{children}
<EditorContextMenu />
```

- [ ] **Step 4: EditorFloatingDelete.tsx 삭제**

```bash
git rm src/components/Chart/EditorFloatingDelete.tsx
```

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit 2>&1 | grep -v "^npm warn"
```

Expected: 출력 없음

- [ ] **Step 6: 전체 테스트 실행**

```bash
npm test -- --watchAll=false 2>&1 | tail -15
```

Expected: editorContextActions 9개 포함 전체 PASS (App.test.tsx 기존 실패 제외)

- [ ] **Step 7: 커밋**

```bash
git add src/components/Chart/EditorContextMenu.tsx src/components/Chart/ChartEditorToolbar.tsx src/components/Chart/ChartArea.tsx
git rm src/components/Chart/EditorFloatingDelete.tsx
git commit -m "feat(editor): 플로팅 컨텍스트 메뉴 추가 (연장/삭제), 툴바 Delete 버튼 제거"
```
