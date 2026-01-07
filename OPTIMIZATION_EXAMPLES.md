# 🎯 성능 최적화 구체적 개선 방안

## 1. 드래그 성능 개선 (즉시 적용 가능)

### 문제점
`useChart.ts`의 `handleMouseMove`가 마우스 움직임마다 상태를 업데이트하여 전체 차트가 리렌더링됨

### 해결 방법 A: requestAnimationFrame으로 Throttle

```typescript
// src/hooks/useChart.ts

const handleMouseMove = useCallback(
  (e: MouseEvent) => {
    if (!isDragging) return;

    // ❌ Before: 매 이벤트마다 상태 업데이트
    // setIndexDomain(...);
    // setPriceDomain(...);

    // ✅ After: requestAnimationFrame으로 throttle
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // X축 패닝
      if (Math.abs(deltaX) > 1) {
        const indexRange = indexDomain.endIndex - indexDomain.startIndex;
        const indexPerPixel = indexRange / width;
        const indexDelta = -deltaX * indexPerPixel;

        const newStart = Math.round(indexDomain.startIndex + indexDelta);
        const newEnd = Math.round(indexDomain.endIndex + indexDelta);

        if (newStart >= 0) {
          setIndexDomain({
            startIndex: newStart,
            endIndex: newEnd,
          });
        }
      }

      // Y축 패닝
      if (Math.abs(deltaY) > 1) {
        const priceRange = priceDomain.maxPrice - priceDomain.minPrice;
        const pricePerPixel = priceRange / height;
        const priceDelta = deltaY * pricePerPixel;

        setPriceDomain({
          minPrice: priceDomain.minPrice + priceDelta,
          maxPrice: priceDomain.maxPrice + priceDelta,
        });
      }

      setDragStart({ x: e.clientX, y: e.clientY });
    });
  },
  [isDragging, dragStart, indexDomain, priceDomain, width, height, setIndexDomain, setPriceDomain]
);
```

**예상 개선:** 드래그 FPS 20-30 → 50-60

---

### 해결 방법 B: Transform 기반 즉시 반응 + Debounce 상태 업데이트

```typescript
// Transform으로 시각적 이동 먼저 처리 (즉각 반응)
// 상태 업데이트는 debounce로 지연 처리

const [tempTransform, setTempTransform] = useState({ x: 0, y: 0 });

const handleMouseMove = useCallback((e: MouseEvent) => {
  if (!isDragging) return;

  const deltaX = e.clientX - dragStart.x;
  const deltaY = e.clientY - dragStart.y;

  // 즉시 transform 적용 (리렌더링 없음)
  setTempTransform({ x: deltaX, y: deltaY });

  // 상태 업데이트는 debounce
  debouncedUpdateDomain(deltaX, deltaY);
}, [isDragging, dragStart]);

// 차트에 transform 적용
<div style={{ transform: `translate(${tempTransform.x}px, ${tempTransform.y}px)` }}>
  {/* 캔들스틱들 */}
</div>
```

---

## 2. Candlestick 컴포넌트 메모이제이션

### 문제점
100개의 캔들이 매번 리렌더링됨

### 해결책

```typescript
// src/components/Chart/Candlestick.tsx

// ❌ Before
export const Candlestick: React.FC<CandlestickProps> = ({ data, x, y, width, high, low, open, close }) => {
  // ...
};

// ✅ After
export const Candlestick: React.FC<CandlestickProps> = React.memo(
  ({ data, x, y, width, high, low, open, close }) => {
    // ...
  },
  // 커스텀 비교 함수로 불필요한 리렌더링 방지
  (prevProps, nextProps) => {
    return (
      prevProps.x === nextProps.x &&
      prevProps.y === nextProps.y &&
      prevProps.width === nextProps.width &&
      prevProps.high === nextProps.high &&
      prevProps.low === nextProps.low &&
      prevProps.open === nextProps.open &&
      prevProps.close === nextProps.close
    );
  }
);
```

**예상 개선:** 불필요한 리렌더링 80% 감소

---

## 3. Crosshair 최적화

### 문제점
마우스 움직임마다 가격/시간 계산 및 렌더링

### 해결책 A: Throttle 적용

```typescript
// src/components/Chart/Crosshair.tsx

export const Crosshair: React.FC<CrosshairProps> = ({ width, height }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // ❌ Before: 매 마우스 이동마다 업데이트
  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  // ✅ After: throttle 적용
  const throttledHandleMouseMove = useCallback(
    throttle((e: React.MouseEvent) => {
      setPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    }, 16), // 60fps = 16ms
    []
  );

  return (
    <div onMouseMove={throttledHandleMouseMove}>
      {/* ... */}
    </div>
  );
};
```

### 해결책 B: CSS transform 활용

```typescript
// 상태 업데이트 없이 CSS transform으로 이동
const crosshairRef = useRef<HTMLDivElement>(null);

const handleMouseMove = (e: React.MouseEvent) => {
  if (crosshairRef.current) {
    crosshairRef.current.style.transform = `translate(${e.nativeEvent.offsetX}px, ${e.nativeEvent.offsetY}px)`;
  }
};
```

---

## 4. useMemo/useCallback 최적화

### CandlestickChart.tsx

```typescript
// ❌ Before: 매 렌더링마다 재계산
const gridLines = /* 계산 */;

// ✅ After: 의존성 변경 시에만 재계산
const gridLines = useMemo(() => {
  const { labels } = getVisiblePriceLabels(
    chart.domain.price.minPrice,
    chart.domain.price.maxPrice,
    10
  );
  const priceRange = chart.domain.price.maxPrice - chart.domain.price.minPrice;
  return labels.map((price) => {
    const y = height - ((price - chart.domain.price.minPrice) / priceRange) * height;
    return { price, y };
  });
}, [chart.domain.price, height]); // 의존성 명시
```

### useChart Hook

```typescript
// ❌ Before: 매 렌더링마다 새 함수 생성
const handleWheel = (e: React.WheelEvent) => {
  // ...
};

// ✅ After: 함수 참조 고정
const handleWheel = useCallback(
  (e: React.WheelEvent) => {
    if (!e.defaultPrevented && e.cancelable) {
      e.preventDefault();
    }
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    zoomX(factor);
  },
  [zoomX]
);
```

---

## 5. 가상화 (Virtualization) 구현

### 문제점
1000개 캔들을 모두 렌더링하면 성능 저하

### 해결책

```typescript
// src/components/Chart/CandlestickChart.tsx

const { visibleData } = chart;

// ✅ 보이는 범위의 캔들만 렌더링
const visibleCandlesticks = useMemo(() => {
  // indexDomain에서 실제 보이는 캔들만 필터링
  const { startIndex, endIndex } = chart.domain.index;

  // 약간의 버퍼 추가 (스크롤 시 부드러움)
  const bufferSize = 10;
  const start = Math.max(0, Math.floor(startIndex) - bufferSize);
  const end = Math.min(data.length, Math.ceil(endIndex) + bufferSize);

  return data.slice(start, end).map((candle, i) => {
    const actualIndex = start + i;
    const pos = candleToPixels(candle, actualIndex, chart.domain, chart.range);
    return { candle, pos, index: actualIndex };
  });
}, [data, chart.domain, chart.range]);

// 필터링된 캔들만 렌더링
{visibleCandlesticks.map(({ candle, pos, index }) => (
  <Candlestick key={index} data={candle} {...pos} />
))}
```

**예상 개선:** 대용량 데이터(1000+ 캔들)에서 50% 성능 향상

---

## 6. WebWorker로 패턴 분석 분리

### 문제점
`usePatternAnalysis`가 메인 스레드에서 실행되어 UI 블로킹

### 해결책

```typescript
// src/workers/patternAnalyzer.worker.ts
self.onmessage = (e: MessageEvent) => {
  const { data, timeframe } = e.data;

  // 무거운 패턴 분석 작업
  const patterns = analyzePatterns(data);

  self.postMessage({ patterns, timeframe });
};

// src/hooks/usePatternAnalysis.ts
const worker = useMemo(() => new Worker('patternAnalyzer.worker.ts'), []);

useEffect(() => {
  worker.postMessage({ data, timeframe });

  worker.onmessage = (e) => {
    setPatterns(e.data.patterns);
  };

  return () => worker.terminate();
}, [data, timeframe]);
```

---

## 7. Canvas 렌더링 전환 (고급)

### 문제점
DOM 기반 렌더링은 수백 개 요소에서 한계

### 해결책

```typescript
// src/components/Chart/CandlestickChartCanvas.tsx

export const CandlestickChartCanvas: React.FC<Props> = ({ data, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 클리어
    ctx.clearRect(0, 0, width, height);

    // 모든 캔들을 한 번에 그리기
    data.forEach((candle, i) => {
      const pos = candleToPixels(candle, i, domain, range);

      // 캔들 몸통
      ctx.fillStyle = candle.close >= candle.open ? '#22c55e' : '#ef4444';
      ctx.fillRect(pos.x, pos.y, pos.width, pos.bodyHeight);

      // 위아래 꼬리
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      ctx.moveTo(pos.centerX, pos.high);
      ctx.lineTo(pos.centerX, pos.low);
      ctx.stroke();
    });
  }, [data, domain, range, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};
```

**예상 개선:**
- 렌더링 시간 70% 감소
- 메모리 사용량 60% 감소
- 1000+ 캔들도 60fps 유지

---

## 8. Throttle/Debounce 유틸리티

```typescript
// src/utils/throttle.ts

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall < delay) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = now;
        func(...args);
      }, delay);
    } else {
      lastCall = now;
      func(...args);
    }
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
```

---

## 📊 최적화 우선순위 및 예상 효과

| 순위 | 최적화 항목 | 난이도 | 예상 효과 | 소요 시간 |
|------|------------|--------|----------|----------|
| 1 | handleMouseMove throttle | 쉬움 | ⭐⭐⭐⭐⭐ | 30분 |
| 2 | Candlestick React.memo | 쉬움 | ⭐⭐⭐⭐ | 20분 |
| 3 | useMemo/useCallback 추가 | 쉬움 | ⭐⭐⭐ | 1시간 |
| 4 | Crosshair throttle | 쉬움 | ⭐⭐⭐ | 30분 |
| 5 | 가상화 구현 | 중간 | ⭐⭐⭐⭐ | 2시간 |
| 6 | WebWorker 분리 | 중간 | ⭐⭐⭐ | 3시간 |
| 7 | Canvas 전환 | 어려움 | ⭐⭐⭐⭐⭐ | 1-2일 |

---

## 🚀 추천 최적화 순서

### Phase 1: 빠른 개선 (2-3시간)
1. ✅ handleMouseMove에 requestAnimationFrame 적용
2. ✅ Candlestick에 React.memo 적용
3. ✅ Crosshair throttle 적용
4. ✅ 주요 컴포넌트에 useMemo/useCallback 추가

**예상 결과:** 드래그 FPS 30 → 50+

---

### Phase 2: 중급 개선 (1일)
5. ✅ 가상화 구현
6. ✅ WebWorker로 패턴 분석 분리
7. ✅ 성능 측정 및 비교

**예상 결과:** 전체적인 반응성 향상, 대용량 데이터 처리 개선

---

### Phase 3: 고급 개선 (2-3일, 선택사항)
8. ✅ Canvas 기반 렌더링 전환
9. ✅ OffscreenCanvas 활용
10. ✅ WebGL 고려 (초대용량 데이터)

**예상 결과:** 프로페셔널 금융 차트 수준의 성능

---

## 📈 측정 후 다음 단계

1. Before 성능 측정 완료
2. Phase 1 적용
3. After 성능 측정
4. 개선율 계산 및 문서화
5. 필요 시 Phase 2, 3 진행
