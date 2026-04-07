# Editor Context Menu Design

## Goal

선택된 드로잉 객체 근처에 플로팅 컨텍스트 메뉴를 표시한다. 툴 종류에 따라 다른 액션(삭제, 추세선 연장 등)을 제공하며, 새 드로잉 툴 추가 시 컴포넌트 수정 없이 레지스트리만 확장할 수 있는 구조로 설계한다.

## Architecture

**핵심 원칙:** 컨텍스트 메뉴 컴포넌트는 순수 렌더러이고, 각 툴의 액션 정의는 별도 설정 파일에서 관리한다.

**컴포넌트 트리:**
```
CandlestickChart
  └── ChartArea
        └── EditorContextMenu   ← EditorFloatingDelete 교체
```

## Data Model Changes

### TrendlineObject 확장

`src/types/editor.types.ts`의 `TrendlineObject`에 연장 플래그 추가:

```typescript
export interface TrendlineObject extends BaseDrawingObject {
  tool: 'trendline';
  p1: { index: number; price: number };
  p2: { index: number; price: number };
  extendLeft?: boolean;   // true = p1 방향으로 차트 왼쪽 끝까지 연장
  extendRight?: boolean;  // true = p2 방향으로 차트 오른쪽 끝까지 연장
}
```

기본값은 `undefined` (= false). localStorage 직렬화에 자동 포함된다.

### 새 Atom

`src/stores/atoms/editorAtoms.ts`에 추가:

```typescript
// 컨텍스트 메뉴를 표시할 화면 좌표 (null = 메뉴 닫힘)
export const contextMenuPositionAtom = atom<{ x: number; y: number } | null>(null);
```

`selectedObjectIdAtom`이 null이 되면 컴포넌트에서 메뉴가 자동으로 사라진다.

## Context Actions Registry

**`src/config/editorContextActions.ts`** (신규):

```typescript
export interface ContextMenuAction {
  id: string;
  label: string;
  icon: string;
  type: 'button' | 'toggle';
  isActive?: (obj: DrawingObject) => boolean;  // toggle 상태 판단
  onAction: (obj: DrawingObject) => DrawingObject | null;
  // null 반환 = 객체 삭제
}

export const CONTEXT_ACTIONS: Record<ActiveToolType, ContextMenuAction[]> = {
  hline: [
    deleteAction,
  ],
  trendline: [
    extendLeftAction,   // ← 토글
    extendRightAction,  // → 토글
    deleteAction,       // 🗑 버튼
  ],
  // 새 툴 추가 시 여기에만 등록
};
```

**액션 정의:**
- `extendLeftAction`: `isActive = (obj) => (obj as TrendlineObject).extendLeft ?? false`, `onAction = obj => ({ ...obj, extendLeft: !obj.extendLeft })`
- `extendRightAction`: 동일 패턴으로 `extendRight`
- `deleteAction`: `onAction = () => null`

## EditorContextMenu Component

**`src/components/Chart/EditorContextMenu.tsx`** (`EditorFloatingDelete.tsx` 교체):

- `selectedObjectIdAtom`, `contextMenuPositionAtom`, `drawingObjectsAtom` 구독
- `CONTEXT_ACTIONS[selectedObj.tool]`로 해당 툴의 액션 목록 조회
- 각 액션을 `type`에 따라 버튼(button) 또는 토글(toggle) 렌더링
  - toggle: `isActive(obj)` 결과로 활성/비활성 스타일 적용
- 위치: `contextMenuPositionAtom` 좌표 기준 `transform: translate(-50%, 8px)` (클릭 바로 아래)
  - 화면 우측 경계 초과 시 왼쪽으로 clamp
  - 화면 하단 경계 초과 시 위쪽(-height-8px)으로 flip
- `onAction` 반환값:
  - `DrawingObject` → `setDrawingObjects`로 해당 obj 업데이트
  - `null` → 삭제 후 `setSelectedId(null)`, `setEditorMode('pan')`, `setContextMenuPosition(null)`

## Trendline Extend Rendering

`src/hooks/useEditorCanvas.ts`의 `renderTrendline` 함수 수정:

두 점 (x1,y1), (x2,y2)에서 slope를 계산한 뒤:
- `extendLeft`: slope를 역방향으로 x=0까지 연장한 점 계산 → 선 시작점으로 사용
- `extendRight`: slope를 정방향으로 x=range.width까지 연장한 점 계산 → 선 끝점으로 사용
- 연장된 부분은 동일한 색상과 선 굵기로 그린다

## Interaction Changes

### useEditorInteraction.ts

`handlePanModeClick`에서 객체 hit 시 `contextMenuPositionAtom`도 함께 설정:

```typescript
if (hit) {
  e.stopPropagation();
  setSelectedId(hit.id);
  setEditorMode('select');
  setContextMenuPosition({ x: pos.x, y: pos.y });  // 추가
} else {
  setSelectedId(null);
  setContextMenuPosition(null);  // 추가
}
```

`setContextMenuPosition` 의존성 추가 필요.

### ChartEditorToolbar.tsx

Delete 버튼 제거. HLine / Trendline / Magnet 세 버튼만 유지.

### ChartArea.tsx

`EditorFloatingDelete` import/렌더링 → `EditorContextMenu`로 교체.

## File Summary

| 파일 | 변경 유형 |
|------|-----------|
| `src/types/editor.types.ts` | 수정 — TrendlineObject에 extendLeft/extendRight 추가 |
| `src/stores/atoms/editorAtoms.ts` | 수정 — contextMenuPositionAtom 추가 |
| `src/config/editorContextActions.ts` | 신규 — 액션 레지스트리 |
| `src/components/Chart/EditorContextMenu.tsx` | 신규 — 컨텍스트 메뉴 컴포넌트 |
| `src/components/Chart/EditorFloatingDelete.tsx` | 삭제 |
| `src/hooks/useEditorCanvas.ts` | 수정 — extendLeft/extendRight 렌더링 |
| `src/hooks/useEditorInteraction.ts` | 수정 — contextMenuPosition 설정 |
| `src/components/Chart/ChartEditorToolbar.tsx` | 수정 — Delete 버튼 제거 |
| `src/components/Chart/ChartArea.tsx` | 수정 — EditorContextMenu 렌더링 |
