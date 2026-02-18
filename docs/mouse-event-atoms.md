# 마우스 이벤트 Atom 선택적 도입

## 문제 인식

차트의 인터랙션 상태가 3가지 메커니즘에 분산되어 있었다:

| 메커니즘 | 위치 | 상태 |
|----------|------|------|
| `useRef` | useChartPanZoom, useZoomDrag | isDraggingRef, dragStartRef |
| `useState` | Crosshair.tsx | mousePos |
| `useState` | useCandleHover | hoveredCandle, prevCandle, tooltipPosition, isVisible |

데이터 상태(rawData, domain, range)는 이미 Jotai atom으로 관리되고 있었지만, 인터랙션 상태는 훅/컴포넌트에 흩어져 있어:
- **상태 추적이 어려움** — isDragging이 어디서 설정되는지 추적 필요
- **props 체인** — isDragging을 CandlestickChart → useCandleHover로 전달
- **컴포넌트 결합** — CandleTooltip이 부모에 의존하여 렌더링 독립성 부족

## 해결 방향

Jotai 공식 문서의 마우스 이벤트 atom 패턴에서 아이디어를 얻어, **공유가 필요한 인터랙션 상태만 선택적으로 atom화**.

### 핵심 원칙

> 고빈도 연산(드래그 중 domain 계산)은 ref 유지, 상태 공유가 필요한 부분만 atom으로 전환

## 도입된 Atom

파일: `src/stores/atoms/interactionAtoms.ts`

### 1. `isDraggingAtom`
- **타입**: `atom(false)`
- **쓰기**: useChartPanZoom (mousedown/mouseup), useZoomDrag (mousedown/mouseup)
- **읽기**: useCandleHover (툴팁 억제), tooltipVisibleAtom (파생)
- **빈도**: 낮음 — mousedown/mouseup 전환 시에만 변경
- **참고**: isDraggingRef는 유지됨 (RAF 콜백 내부의 동기적 가드에 필요)

### 2. `crosshairPositionAtom`
- **타입**: `atom<{ x: number; y: number } | null>(null)`
- **쓰기/읽기**: Crosshair.tsx
- **빈도**: 높음 — 매 mousemove마다 (기존 useState와 동일)
- **의미**: null = 마우스가 차트 밖

### 3. `hoveredCandleAtom`
- **타입**: `atom<HoveredCandleState | null>(null)`
- **쓰기**: useCandleHover
- **읽기**: CandleTooltip, tooltipVisibleAtom
- **통합 이유**: candle + prevCandle + tooltipPosition이 항상 함께 변경

### 4. `tooltipVisibleAtom` (파생)
- **타입**: `atom((get) => boolean)`
- **계산**: `hoveredCandleAtom !== null && !isDraggingAtom`
- **핵심 이점**: isDragging과 hoveredCandle의 조합을 선언적으로 표현

## 변경 요약

### 생산자 (쓰기) 측

| 훅 | 변경 내용 |
|----|-----------|
| useChartPanZoom | `setIsDragging(true/false)` 추가 (isDraggingRef 유지) |
| useZoomDrag | `setGlobalDragging(true/false)` 추가 (로컬 isDragging useState 유지) |
| useCandleHover | `setHoveredCandle({...})` / `setHoveredCandle(null)` |

### 소비자 (읽기) 측

| 컴포넌트/훅 | 변경 내용 |
|-------------|-----------|
| CandleTooltip | props 제거 → `useAtomValue(hoveredCandleAtom)` + `useAtomValue(tooltipVisibleAtom)` |
| Crosshair | `useState` → `useAtom(crosshairPositionAtom)` |
| useCandleHover | `isDragging` 파라미터 → `useAtomValue(isDraggingAtom)` |

### 제거된 것

- `useChart`의 return에서 `isDraggingRef` 제거
- `useCandleHover`의 4개 useState (hoveredCandle, prevCandle, tooltipPosition, isVisible)
- `CandleTooltip`의 props 인터페이스
- `CandlestickChart`의 `chart.isDraggingRef.current` 참조

## 변경하지 않은 것

- useChartPanZoom 내부 드래그 로직 (RAF, window listener, domain refs)
- useZoomDrag 내부 드래그 로직 (RAF, window listener)
- useChartPanZoom handleWheel (16ms 스로틀)
- Crosshair의 pixelToPrice/pixelToTime 인라인 계산
- useCandleHover 타이머 로직 (500ms HOVER_DELAY 등)
- calculateTooltipPosition 유틸 함수
- 기존 atom 파일들 (domainAtoms, dataAtoms, actionAtoms, rangeAtoms, patternAtoms)
- TimeAxis, PriceAxis 컴포넌트

## 데이터 흐름

```
사용자 mousedown
  → useChartPanZoom.handleMouseDown
    → isDraggingRef.current = true  (RAF 동기 가드용)
    → setIsDragging(true)           (atom - 리액트 구독자 알림)
      → useCandleHover useEffect → hideTooltip()
      → tooltipVisibleAtom → false

사용자 mouseup
  → useChartPanZoom.handleMouseUp
    → isDraggingRef.current = false
    → setIsDragging(false)
      → tooltipVisibleAtom → hoveredCandleAtom 의존

사용자 mousemove (캔들 위 500ms 체류)
  → useCandleHover.handleMouseMove
    → setTimeout → setHoveredCandle({ candle, prevCandle, tooltipPosition })
      → CandleTooltip 자체 구독으로 렌더링
      → tooltipVisibleAtom → true
```
