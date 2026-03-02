# Mobile View Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 모바일 뷰의 줌 버그 수정, 줌 기준점 개선, 크로스헤어 탭 토글, UI 축소, 라벨 스타일 변경

**Architecture:** Jotai atom 기반 상태 관리에서 zoomXAtom에 anchor 파라미터 추가, useTouchGestures 제스처 로직 변경, Tailwind 반응형 클래스 조정

**Tech Stack:** React 19, TypeScript, Jotai, Tailwind CSS, Canvas

---

### Task 1: 시간축 과도 확장 버그 수정

**Files:**
- Modify: `src/stores/atoms/actionAtoms.ts:99-131`

**Step 1: MIN_ZOOM_RANGE 증가 및 endIndex 클램핑 수정**

`actionAtoms.ts`의 CONFIG와 zoomXAtom을 수정한다:

```typescript
// CONFIG 변경
MIN_ZOOM_RANGE: 20, // 기존 10 → 20

// zoomXAtom 마지막 부분 수정 (line 127-130)
set(indexDomainAtom, {
  startIndex: Math.max(0, Math.round(startIndex)),
  endIndex: Math.round(endIndex), // 기존: Math.min(dataLength - 1, Math.round(endIndex))
});
```

핵심: `endIndex`를 `dataLength - 1`로 클램핑하지 않고, 이미 상위에서 `maxEnd`로 제한하고 있으므로 미래 여백을 보존한다.

**Step 2: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

**Step 3: 수동 검증**

- 데스크톱: 마우스 휠로 극단적 줌 인 → 범위가 20 캔들 이하로 줄어들지 않는지 확인
- 모바일(DevTools): 핀치 줌으로 극단적 줌 인 → 패닝이 여전히 동작하는지 확인

**Step 4: Commit**

```bash
git add src/stores/atoms/actionAtoms.ts
git commit -m "fix: 시간축 과도 확장 버그 수정 (MIN_ZOOM_RANGE 증가, endIndex 클램핑 완화)"
```

---

### Task 2: 줌 기준점을 마우스/핀치 위치 기반으로 변경

**Files:**
- Modify: `src/stores/atoms/actionAtoms.ts:99-131`
- Modify: `src/hooks/useChartPanZoom.ts:119-135`
- Modify: `src/hooks/useTouchGestures.ts:226-244`

**Step 1: zoomXAtom에 anchor 파라미터 추가**

`actionAtoms.ts`의 `zoomXAtom`을 수정한다:

```typescript
// X축 줌 - anchor 기반 (0=왼쪽, 1=오른쪽, undefined=중앙)
export const zoomXAtom = atom(null, (get, set, { factor, anchor }: { factor: number; anchor?: number }) => {
  const domain = get(indexDomainAtom);
  const dataLength = get(rawDataAtom).length;

  const currentRange = domain.endIndex - domain.startIndex;
  const newRange = currentRange * factor;

  // 범위 검증
  if (newRange < CONFIG.MIN_ZOOM_RANGE) return;
  if (newRange > dataLength + CONFIG.MAX_FUTURE_BUFFER) return;

  // anchor가 있으면 해당 위치 기준, 없으면 중앙 기준
  const anchorRatio = anchor ?? 0.5;
  const anchorIndex = domain.startIndex + currentRange * anchorRatio;

  let startIndex = anchorIndex - newRange * anchorRatio;
  let endIndex = anchorIndex + newRange * (1 - anchorRatio);

  // 왼쪽 경계
  if (startIndex < 0) {
    startIndex = 0;
    endIndex = newRange;
  }

  // 오른쪽 경계
  const maxEnd = dataLength - 1 + CONFIG.MAX_FUTURE_BUFFER;
  if (endIndex > maxEnd) {
    endIndex = maxEnd;
    startIndex = Math.max(0, endIndex - newRange);
  }

  set(indexDomainAtom, {
    startIndex: Math.max(0, Math.round(startIndex)),
    endIndex: Math.round(endIndex),
  });
});
```

**Step 2: useChartPanZoom의 handleWheel에서 anchor 전달**

`useChartPanZoom.ts`의 `handleWheel`을 수정한다:

```typescript
const handleWheel = useCallback(
  (e: React.WheelEvent) => {
    if (!e.defaultPrevented && e.cancelable) {
      e.preventDefault();
    }

    const now = Date.now();
    if (now - lastWheelTimeRef.current < 16) {
      return;
    }
    lastWheelTimeRef.current = now;

    const factor = e.deltaY > 0 ? 1.1 : 0.9;

    // 마우스 위치 기반 anchor 계산
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const anchor = (e.clientX - rect.left) / rect.width;

    zoomX({ factor, anchor });
  },
  [zoomX],
);
```

**Step 3: useTouchGestures 핀치 줌에서 anchor 전달**

`useTouchGestures.ts`의 PINCHING 핸들러를 수정한다:

```typescript
// PINCHING: 핀치 줌
if (state === 'pinching' && e.touches.length === 2) {
  if (rafIdRef.current !== null) return;

  const t1 = e.touches[0];
  const t2 = e.touches[1];
  const currentDist = getDistance(t1, t2);

  // 핀치 중심점 계산
  const centerX = (t1.clientX + t2.clientX) / 2;

  rafIdRef.current = requestAnimationFrame(() => {
    rafIdRef.current = null;

    const scaleFactor = pinchStartDistRef.current / currentDist;
    const clampedFactor = Math.max(0.8, Math.min(1.2, scaleFactor));

    // 핀치 중심을 anchor로 사용
    const rect = containerRef.current?.getBoundingClientRect();
    const anchor = rect ? (centerX - rect.left) / rect.width : 0.5;

    zoomX({ factor: clampedFactor, anchor });

    pinchStartDistRef.current = currentDist;
  });
  return;
}
```

**Step 4: useZoomDrag의 onZoom 호출부 업데이트**

`useZoomDrag.ts`에서 `onZoom` 호출 시그니처는 그대로 유지 (축 드래그는 center 기준이므로). 대신 호출하는 곳 (TimeAxis, PriceAxis)에서 `zoomX({ factor, anchor: undefined })`로 변경이 필요.

TimeAxis와 PriceAxis에서 `useZoomDrag`의 `onZoom` 콜백을 확인하고, `zoomX` 호출부를 `{ factor }` 형태로 감싸준다.

**Step 5: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

**Step 6: 수동 검증**

- 데스크톱: 차트 왼쪽 끝에 마우스를 두고 휠 줌 → 왼쪽 끝이 고정되며 줌
- 데스크톱: 차트 오른쪽에서 줌 → 오른쪽 기준 줌
- 모바일: 핀치 줌 → 두 손가락 중심 기준 줌
- TimeAxis/PriceAxis 드래그 줌 → 기존 동작 유지

**Step 7: Commit**

```bash
git add src/stores/atoms/actionAtoms.ts src/hooks/useChartPanZoom.ts src/hooks/useTouchGestures.ts
git commit -m "feat: 줌 기준점을 마우스/핀치 위치 기반으로 변경"
```

---

### Task 3: 모바일 크로스헤어 탭 토글 방식으로 변경

**Files:**
- Modify: `src/hooks/useTouchGestures.ts`

**Step 1: 제스처 로직을 탭 토글 방식으로 변경**

핵심 변경사항:
- 롱프레스 타이머 제거
- `pending` 상태에서 손을 떼면 (이동 없이) → 크로스헤어 토글
- 크로스헤어 활성 상태에서 터치 → 크로스헤어 위치 업데이트 또는 비활성화
- 크로스헤어 활성 상태에서 이동 → 크로스헤어 따라감

```typescript
// 상수 변경
const TAP_THRESHOLD = 10; // 탭으로 인정할 최대 이동 거리 (px)
// LONG_PRESS_DELAY 제거
// CROSSHAIR_LINGER_DELAY 제거

// isCrosshairActiveAtom을 useAtom으로 변경 (읽기+쓰기)
const [isCrosshairActive, setIsCrosshairActive] = useAtom(isCrosshairActiveAtom);
const isCrosshairActiveRef = useRef(isCrosshairActive);
useEffect(() => { isCrosshairActiveRef.current = isCrosshairActive; }, [isCrosshairActive]);

// handleTouchStart: 롱프레스 타이머 제거, 크로스헤어 활성 상태면 즉시 위치 업데이트
// handleTouchMove: 크로스헤어 활성+이동 시 크로스헤어 따라감
// handleTouchEnd: pending 상태에서 이동 없이 손 뗌 → 토글
```

상세 구현:

**handleTouchStart:**
```typescript
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  // 2손가락: 핀치 (기존 동일)
  if (e.touches.length === 2) { /* 기존 핀치 로직 */ return; }

  if (e.touches.length === 1) {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };

    if (isCrosshairActiveRef.current) {
      // 크로스헤어 활성 상태: 바로 crosshair 모드로, 위치 업데이트
      gestureStateRef.current = 'crosshair';
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setCrosshairPosition({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          source: 'touch',
        });
      }
    } else {
      gestureStateRef.current = 'pending';
    }
  }
}, [...]);
```

**handleTouchEnd:**
```typescript
const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  const state = gestureStateRef.current;

  if (state === 'pending') {
    // 이동 없이 손 뗌 = 탭 → 크로스헤어 활성화
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPosRef.current.x;
    const dy = touch.clientY - touchStartPosRef.current.y;

    if (Math.sqrt(dx * dx + dy * dy) < TAP_THRESHOLD) {
      setIsCrosshairActive(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setCrosshairPosition({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          source: 'touch',
        });
      }
    }
  }

  if (state === 'crosshair') {
    // 크로스헤어 모드에서 손 뗌 → 탭이었으면 비활성화, 이동이었으면 유지
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPosRef.current.x;
    const dy = touch.clientY - touchStartPosRef.current.y;

    if (Math.sqrt(dx * dx + dy * dy) < TAP_THRESHOLD) {
      // 탭 = 비활성화
      setIsCrosshairActive(false);
      setCrosshairPosition(null);
    }
    // 이동이었으면 크로스헤어 유지 (위치는 마지막 위치에 고정)
  }

  if (state === 'panning') { setIsDragging(false); }
  if (state === 'pinching') { setIsDragging(false); }

  if (rafIdRef.current !== null) {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  }
  gestureStateRef.current = 'idle';
}, [...]);
```

**Step 2: 불필요한 롱프레스/linger 코드 정리**

- `LONG_PRESS_DELAY`, `CROSSHAIR_LINGER_DELAY` 상수 제거
- `longPressTimerRef`, `lingerTimerRef` 제거
- `clearLongPressTimer`, `clearLingerTimer` 함수 제거

**Step 3: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

**Step 4: 수동 검증**

- 모바일: 차트 탭 → 크로스헤어 나타남
- 모바일: 크로스헤어 상태에서 손가락 드래그 → 크로스헤어 따라감
- 모바일: 크로스헤어 상태에서 다시 탭 → 크로스헤어 사라짐
- 모바일: 5px 이상 이동 → 패닝 동작 (크로스헤어 아닌 상태)

**Step 5: Commit**

```bash
git add src/hooks/useTouchGestures.ts
git commit -m "feat: 모바일 크로스헤어를 탭 토글 방식으로 변경"
```

---

### Task 4: 모바일 UI 축소

**Files:**
- Modify: `src/components/common/Button.tsx:25-26`
- Modify: `src/components/common/Select.tsx:22`
- Modify: `src/components/Chart/ChartHeader/index.tsx:10-17`
- Modify: `src/components/Chart/ChartHeader/PriceInfo.tsx:21-39`
- Modify: `src/components/Chart/ChartHeader/PriceChange.tsx:14`
- Modify: `src/components/Chart/PatternControlPanel.tsx:25-68`
- Modify: `src/components/Chart/ChartHeader/ConnectionStatus.tsx:11-13`

**Step 1: Button 모바일 사이즈 축소**

```typescript
const sizeStyles = {
  sm: 'px-1.5 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-sm min-h-[28px] sm:min-h-[44px] min-w-[28px] sm:min-w-[44px]',
  md: 'px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-base min-h-[28px] sm:min-h-[44px] min-w-[28px] sm:min-w-[44px]',
  lg: 'px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg min-h-[44px]',
};
```

**Step 2: Select 모바일 사이즈 축소**

```typescript
className={`px-1.5 sm:px-3 py-1 sm:py-3 text-xs sm:text-base font-bold text-gray-800 bg-transparent border-none cursor-pointer focus:outline-none min-h-[28px] sm:min-h-[44px] ${className}`}
```

**Step 3: ChartHeader 패딩/갭 축소**

```tsx
<div className="p-1.5 text-gray-800 sm:p-4">
  <div className="flex flex-row gap-1.5 mb-2 sm:gap-4 sm:mb-6">
    <SymbolBar />
    <ConnectionStatus />
  </div>
  <PriceInfo />
  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
    <IntervalBar />
    <div className="hidden w-px h-4 sm:block bg-neutral-300" />
    <PatternControlPanel />
  </div>
</div>
```

**Step 4: PriceInfo 텍스트 축소**

```tsx
<div className="flex items-start justify-between mb-2 sm:mb-6">
  <div>
    <div className="mb-0.5 sm:mb-1 text-[10px] sm:text-sm text-gray-400">Last Traded Price</div>
    <div className={`text-xl sm:text-4xl font-bold mb-0.5 sm:mb-1 ${priceColor}`}>{formatPrice(currentPrice)}</div>
    <div className="text-[10px] sm:text-sm text-gray-400">Mark Price {formatPrice(currentPrice)}</div>
  </div>
  <div className="text-right">
    <div className="flex gap-3 sm:gap-12">
      <div>
        <div className="mb-0.5 sm:mb-1 text-[10px] sm:text-sm text-gray-400">24h High</div>
        <div className="text-xs sm:text-base font-semibold">{formatPrice(high)}</div>
      </div>
      <div>
        <div className="mb-0.5 sm:mb-1 text-[10px] sm:text-sm text-gray-400">24h Low</div>
        <div className="text-xs sm:text-base font-semibold">{formatPrice(low)}</div>
      </div>
    </div>
  </div>
</div>
```

**Step 5: PriceChange 텍스트 축소**

```tsx
<span className={`text-xs sm:text-lg font-semibold ${priceColor}`}>
```

**Step 6: ConnectionStatus 아이콘 축소**

```tsx
<div className="flex items-center gap-1 sm:gap-2">
  <div
    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-gray-800' : 'bg-gray-300'}`}
    title={isConnected ? 'WebSocket 연결됨' : 'WebSocket 연결 안됨'}
  />
  <span className="text-[10px] sm:text-sm text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
</div>
```

**Step 7: PatternControlPanel 모바일 축소**

```tsx
<div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
  <button
    onClick={toggleEnabled}
    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors ${
      settings.enabled
        ? 'bg-neutral-700 text-neutral-100'
        : 'bg-neutral-200 text-neutral-400'
    }`}
  >
    Zone
  </button>
  {settings.enabled && (
    <>
      {TF_ORDER.map((tf) => (
        <button
          key={tf}
          onClick={() => toggleTimeframe(tf)}
          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors ${
            enabledPatterns[tf]
              ? 'bg-neutral-600 text-neutral-100'
              : 'bg-neutral-200 text-neutral-400'
          }`}
        >
          {TIMEFRAME_LABELS[tf]}
        </button>
      ))}
      <div className="w-px h-3 sm:h-4 bg-neutral-300" />
      <button
        onClick={() => setBreakAction(settings.breakAction === 'cut' ? 'delete' : 'cut')}
        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors ${
          settings.breakAction === 'cut'
            ? 'bg-neutral-500 text-neutral-100'
            : 'bg-neutral-300 text-neutral-600'
        }`}
      >
        {settings.breakAction}
      </button>
    </>
  )}
</div>
```

**Step 8: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

**Step 9: 수동 검증**

- Chrome DevTools 모바일 뷰 (375px) → 모든 컴포넌트가 더 작고 컴팩트한지 확인
- 데스크톱 뷰 → 기존 사이즈 유지 확인
- 모바일 가로 모드 → 레이아웃 깨지지 않는지 확인

**Step 10: Commit**

```bash
git add src/components/common/Button.tsx src/components/common/Select.tsx src/components/Chart/ChartHeader/index.tsx src/components/Chart/ChartHeader/PriceInfo.tsx src/components/Chart/ChartHeader/PriceChange.tsx src/components/Chart/ChartHeader/ConnectionStatus.tsx src/components/Chart/PatternControlPanel.tsx
git commit -m "feat: 모바일 UI 전체 축소 (헤더, 버튼, 셀렉트, 패턴 컨트롤)"
```

---

### Task 5: High/Low 라벨 배경색을 투명 회색으로 변경

**Files:**
- Modify: `src/components/Chart/HighLowLines.tsx:75,95`

**Step 1: 라벨 스타일 변경**

두 라벨 모두 동일하게 변경:

기존:
```
className="absolute px-2 py-1 font-mono text-xs text-gray-600 bg-white border border-gray-300 rounded whitespace-nowrap"
```

변경:
```
className="absolute px-2 py-1 font-mono text-xs text-gray-600 bg-gray-500/20 backdrop-blur-sm rounded whitespace-nowrap"
```

변경 내용: `bg-white border border-gray-300` → `bg-gray-500/20 backdrop-blur-sm` (보더 제거, 투명 회색 배경)

**Step 2: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

**Step 3: 수동 검증**

- 차트에서 최고가/최저가 라벨 → 투명한 회색 배경, 보더 없음 확인
- 라벨 뒤의 차트 내용이 살짝 비쳐 보이는지 확인

**Step 4: Commit**

```bash
git add src/components/Chart/HighLowLines.tsx
git commit -m "style: High/Low 라벨 배경을 투명 회색으로 변경"
```
