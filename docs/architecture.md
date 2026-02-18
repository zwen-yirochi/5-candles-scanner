# 프로젝트 아키텍처: Atom & Hook 가이드

## 목차

1. [전체 데이터 흐름](#1-전체-데이터-흐름)
2. [Jotai Atom 기초](#2-jotai-atom-기초)
3. [Atom 레이어 구조](#3-atom-레이어-구조)
4. [커스텀 Hook 구조](#4-커스텀-hook-구조)
5. [컴포넌트와 연결](#5-컴포넌트와-연결)
6. [자주 하는 실수와 팁](#6-자주-하는-실수와-팁)

---

## 1. 전체 데이터 흐름

```
┌─────────────────── 외부 데이터 소스 ───────────────────┐
│                                                        │
│   Binance REST API          Binance WebSocket          │
│        │                          │                    │
└────────┼──────────────────────────┼────────────────────┘
         │                          │
         ▼                          ▼
   useChartData              useBinanceWebSocket
   (fetch → parse)           (실시간 캔들 수신)
         │                          │
         │  setRawData(parsed)      │  updateCandle(candle)
         ▼                          ▼
  ┌──────────────────────────────────────┐
  │           rawDataAtom                │  ← 단일 진실 공급원 (Single Source of Truth)
  │        (전체 캔들 데이터)              │
  └──────────┬───────┬──────────────────┘
             │       │
    ┌────────┘       └────────┐
    ▼                         ▼
 파생 atoms               visibleDataAtom
 - currentPriceAtom        (화면에 보이는
 - prevPriceAtom            캔들만 슬라이스)
 - dataLengthAtom               │
                                ▼
                          컴포넌트 렌더링
```

핵심 원칙: **모든 캔들 데이터는 `rawDataAtom` 하나에만 저장**된다.
나머지는 전부 이 atom에서 파생(derive)되거나 읽어온다.

---

## 2. Jotai Atom 기초

### Atom의 3가지 종류

이 프로젝트에서 사용하는 atom은 딱 3가지로 나뉜다:

```ts
// ① 원시 atom (Primitive Atom) — 값을 직접 저장
const rawDataAtom = atom<CandleData[]>([]);
//   읽기: get(rawDataAtom)     → CandleData[]
//   쓰기: set(rawDataAtom, []) → 직접 값 교체

// ② 파생 atom (Derived/Read-only Atom) — 다른 atom에서 계산
const currentPriceAtom = atom((get) => {
  const data = get(rawDataAtom);  // rawDataAtom을 "구독"
  return data.length > 0 ? data[data.length - 1].close : null;
});
//   읽기만 가능. rawDataAtom이 바뀌면 자동으로 재계산.
//   결과값(number)이 이전과 같으면 구독자는 리렌더되지 않음!

// ③ 액션 atom (Write-only/Action Atom) — 여러 atom을 한번에 조작
const updateCandleAtom = atom(null, (get, set, candle: CandleData) => {
  const data = get(rawDataAtom);  // 읽기 (구독 아님!)
  // ... 로직
  set(rawDataAtom, [...data, candle]);  // 쓰기
});
//   첫 번째 인자 null = 읽기값 없음 (write-only)
//   get()은 현재 값을 "읽기만" 하고, 구독하지 않음
```

### 컴포넌트에서 사용법

```ts
// 읽기만 (구독 → 값 바뀌면 리렌더)
const data = useAtomValue(rawDataAtom);

// 쓰기만 (구독 안 함 → 값 바뀌어도 리렌더 안 됨)
const setData = useSetAtom(rawDataAtom);

// 읽기 + 쓰기
const [domain, setDomain] = useAtom(indexDomainAtom);
```

### 구독 범위가 중요한 이유

```
❌ 나쁜 예: 전체 배열 구독
const rawData = useAtomValue(rawDataAtom);
const price = rawData[rawData.length - 1].close;
→ 배열의 어떤 요소든 바뀌면 리렌더 (WS 틱마다!)

✅ 좋은 예: 파생 atom으로 필요한 값만 구독
const price = useAtomValue(currentPriceAtom);
→ close 가격이 실제로 바뀔 때만 리렌더
```

---

## 3. Atom 레이어 구조

### 레이어 다이어그램

```
┌─────────────────────────────────────────────────────┐
│  Layer 4: Action Atoms  (actionAtoms.ts)            │
│  여러 atom을 조합해서 조작하는 "명령"                   │
│                                                     │
│  initializeChartAtom  — 차트 초기 세팅               │
│  updateCandleAtom     — WS 캔들 병합                 │
│  panXAtom / zoomXAtom — 팬/줌 조작                   │
│  autoFitYAtom         — Y축 자동 맞춤                 │
└──────────────────────┬──────────────────────────────┘
                       │ set()
┌──────────────────────▼──────────────────────────────┐
│  Layer 3: Derived Atoms  (파생)                      │
│  다른 atom에서 자동 계산되는 값                         │
│                                                     │
│  visibleDataAtom    ← rawDataAtom + indexDomainAtom  │
│  currentPriceAtom   ← rawDataAtom                   │
│  prevPriceAtom      ← rawDataAtom                   │
│  dataLengthAtom     ← rawDataAtom                   │
│  chartDomainAtom    ← indexDomainAtom + priceDomain  │
│  patternAnalysisAtom ← timeframeData*Atoms          │
└──────────────────────┬──────────────────────────────┘
                       │ get()
┌──────────────────────▼──────────────────────────────┐
│  Layer 2b: Interaction Atoms  (인터랙션 상태)         │
│  마우스/터치 이벤트에서 발생하는 공유 상태                │
│                                                     │
│  isDraggingAtom       — 드래그 중 여부 (boolean)      │
│  crosshairPositionAtom — 크로스헤어 위치 ({x,y}|null) │
│  hoveredCandleAtom    — 호버 캔들+위치 통합 상태       │
│  tooltipVisibleAtom   — 파생: hovered && !dragging   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Layer 2a: Domain/Range Atoms  (축 상태)             │
│  차트의 "어디를 보고 있는지"                            │
│                                                     │
│  indexDomainAtom   — X축 범위 { startIndex, endIndex }│
│  priceDomainAtom   — Y축 범위 { minPrice, maxPrice }  │
│  chartRangeAtom    — 픽셀 크기 { width, height }      │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Layer 1: Data Atoms  (원본 데이터)                   │
│  외부에서 주입되는 실제 데이터                           │
│                                                     │
│  rawDataAtom          — 전체 캔들 배열                 │
│  timeframeData*Atoms  — 패턴 분석용 타임프레임 데이터    │
└─────────────────────────────────────────────────────┘
```

### 파일별 상세

#### `dataAtoms.ts` — 데이터 저장소

| Atom | 종류 | 역할 | 구독하는 곳 |
|------|------|------|------------|
| `rawDataAtom` | 원시 | 전체 캔들 데이터 배열 | CandlestickChart(hover용), useChartInit |
| `dataLengthAtom` | 파생 | `rawDataAtom.length` | ChartContainer(로딩 체크) |
| `currentPriceAtom` | 파생 | 마지막 캔들의 close 가격 | useChartData(stats), CandlestickChart |
| `prevPriceAtom` | 파생 | 직전 캔들의 close 가격 | CurrentPriceLine, PriceAxis |
| `visibleDataAtom` | 파생 | indexDomain 범위의 캔들만 슬라이스 | useChartInit, HighLowLines |

#### `domainAtoms.ts` — 논리적 좌표계

| Atom | 종류 | 역할 |
|------|------|------|
| `indexDomainAtom` | 원시(reset 가능) | X축: 몇 번째~몇 번째 캔들을 보는지 `{ startIndex, endIndex }` |
| `priceDomainAtom` | 원시(reset 가능) | Y축: 어떤 가격 범위를 보는지 `{ minPrice, maxPrice }` |
| `chartDomainAtom` | 파생 | 위 두 개를 합친 편의 atom `{ index, price }` |

#### `rangeAtoms.ts` — 픽셀 좌표계

| Atom | 종류 | 역할 |
|------|------|------|
| `chartRangeAtom` | 원시 | 차트의 실제 픽셀 크기 `{ width, height }` |

> **Domain vs Range**: Domain = "어떤 데이터를 보는지" (논리적), Range = "화면에서 몇 px인지" (물리적)

#### `interactionAtoms.ts` — 마우스/터치 인터랙션 상태

| Atom | 종류 | 역할 | 쓰기 | 읽기 |
|------|------|------|------|------|
| `isDraggingAtom` | 원시 | 차트/축 드래그 중 여부 | useChartPanZoom, useZoomDrag | useCandleHover, tooltipVisibleAtom |
| `crosshairPositionAtom` | 원시 | 크로스헤어 픽셀 좌표 (null=차트 밖) | Crosshair | Crosshair |
| `hoveredCandleAtom` | 원시 | 호버된 캔들 + prevCandle + 툴팁 위치 통합 | useCandleHover | CandleTooltip, tooltipVisibleAtom |
| `tooltipVisibleAtom` | 파생 | `hoveredCandle !== null && !isDragging` | — | CandleTooltip |

> **설계 원칙**: 고빈도 연산(드래그 중 domain 계산)은 ref로 유지하고, 상태 공유가 필요한 부분만 atom으로 전환.
> isDraggingRef는 RAF 콜백 내부의 동기적 가드에 여전히 필요하므로 ref와 atom이 공존한다.

#### `actionAtoms.ts` — 명령 모음

| Atom | 동작 |
|------|------|
| `updateCandleAtom` | WS 캔들 → rawDataAtom에 병합 (같은 timestamp면 업데이트, 다르면 추가) |
| `initializeChartAtom` | rawDataAtom 기반으로 indexDomain, priceDomain, chartRange 초기 설정 |
| `panXAtom` | X축 이동 (경계 체크 포함) |
| `zoomXAtom` | X축 확대/축소 (최소/최대 범위 제한) |
| `autoFitYAtom` | visibleData 기준 Y축 자동 맞춤 |

#### `patternAtoms.ts` — 패턴 분석

```
timeframeData15mAtom ──→ patternAtom15m ──┐
timeframeData30mAtom ──→ patternAtom30m ──┤
timeframeData1hAtom  ──→ patternAtom1h  ──┼──→ activeDisplayPatternsAtom
timeframeData4hAtom  ──→ patternAtom4h  ──┤     (활성화된 것만 조건부 구독)
                                          │
                          enabledPatternsAtom
```

각 타임프레임이 독립적인 atom이므로, 15m 데이터가 바뀌어도 4h 패턴은 재계산하지 않는다.

---

## 4. 커스텀 Hook 구조

### Hook 의존 관계

```
ChartContainer
  ├── useChartData ──────── useBinanceWebSocket
  │     (fetch + WS 연결)     (WS 클라이언트 관리)
  │
  └── CandlestickChart
        ├── useChart
        │     ├── useChartInit      (초기화 + 데이터 변경 감지)
        │     └── useChartPanZoom   (마우스 드래그/휠 처리)
        │
        └── useCandleHover          (툴팁 표시)
```

### Hook별 상세

#### `useChartData` — 데이터 수급 총괄

```
역할: REST API로 초기 데이터 로드 + WebSocket으로 실시간 업데이트
위치: ChartContainer에서 호출

입력: { symbol, interval, limit, enableWebSocket }
출력: { stats, loading, error, refetch, isWebSocketConnected }

내부 흐름:
  1. fetchBinance() → 파싱 → setRawData(parsed)     ← atom에 직접 쓰기
  2. useBinanceWebSocket → latestCandle 수신
  3. useEffect: latestCandle → updateCandle(candle)  ← action atom으로 병합
  4. currentPriceAtom + stats24hr → stats 계산
```

**포인트**: 이 hook은 `useSetAtom`으로 atom에 쓰기만 하고, `useAtomValue`로는 `currentPriceAtom`만 구독한다. rawDataAtom 전체를 구독하지 않아서 불필요한 리렌더가 없다.

#### `useChartInit` — 차트 초기화 및 데이터 변경 감지

```
역할: rawDataAtom 변경을 감지하고 차트 domain/range 설정
위치: useChart에서 호출

입력: (width, height)
출력: { domain, range, visibleData }

내부 흐름:
  1. rawDataAtom 구독 → chartData.length 감지
  2. 최초 또는 리사이즈 → initializeChartAtom({ width, height })
  3. 새 캔들 추가 → indexDomain을 오른쪽으로 시프트
  4. chartDomainAtom, chartRangeAtom, visibleDataAtom 반환
```

**포인트**: useEffect의 deps가 `[chartData.length, ...]`이다. 같은 캔들의 가격 업데이트(length 변화 없음)에는 반응하지 않고, 새 캔들 추가(length 증가)에만 indexDomain을 시프트한다.

#### `useChartPanZoom` — 팬/줌 인터랙션

```
역할: 마우스 드래그(팬), 휠(줌) 이벤트 처리
위치: useChart에서 호출

출력: { handleWheel, handleMouseDown, autoFitY }

특징:
  - domain/range를 ref에 캐시해서 useEffect 안의 이벤트 핸들러에서 최신 값 접근
  - requestAnimationFrame으로 팬 성능 최적화
  - isDraggingRef: ref로 관리 (RAF 콜백 내부 동기적 가드용)
  - isDraggingAtom: mousedown/mouseup 시에만 쓰기 (다른 컴포넌트에 드래그 상태 공유)
```

**ref + atom 이중 패턴**: isDraggingRef는 RAF 콜백 안에서 동기적으로 참조해야 하므로 ref로 유지한다. 동시에 isDraggingAtom에도 쓰기하여 useCandleHover, CandleTooltip 등 다른 소비자가 드래그 상태를 구독할 수 있다. atom 쓰기는 mousedown/mouseup 시에만 발생하므로 (드래그 중 mousemove마다가 아님) 성능 부담이 없다.

#### `useBinanceWebSocket` — WebSocket 관리

```
역할: Binance kline 스트림 연결 및 캔들 데이터 파싱
위치: useChartData에서 호출

입력: { symbol, interval, enabled }
출력: { latestCandle, isConnected, error, reconnect }

특징:
  - onMessage 콜백을 ref에 저장 → useEffect deps에서 제외
  - 이전 캔들과 비교 후 값이 다를 때만 setState
  - 네트워크 online/offline 이벤트 감지 → 자동 재연결
```

**콜백 ref 패턴**: WebSocket은 `[symbol, interval, enabled]`가 바뀔 때만 재연결해야 한다. 만약 onMessage 콜백이 deps에 있으면 매 렌더마다 재연결된다. 그래서 콜백을 ref에 저장하고, WS 이벤트에서 `onMessageRef.current?.(data)`로 호출한다.

#### `useCandleHover` — 캔들 툴팁

```
역할: 마우스/터치로 캔들 위에 호버 시 툴팁 표시
위치: CandlestickChart에서 호출

입력: (data, domain, range)
출력: { handleMouseMove, handleMouseLeave, handleTouchStart, handleTouchMove, handleTouchEnd }

atom 연동:
  - useAtomValue(isDraggingAtom)  → 드래그 중 툴팁 억제
  - useSetAtom(hoveredCandleAtom) → 캔들 호버 상태 쓰기

특징:
  - 500ms 지연 후 툴팁 표시 (jitter 방지)
  - 터치: 2초 후 자동 숨김
  - isDragging 변경 시 useEffect로 자동 숨김
  - isShowingRef로 콜백 내부에서 "현재 표시 중" 여부 판단
```

> **이전 대비 변경**: `isDragging` 파라미터가 제거되고 atom 구독으로 대체. 4개 useState(hoveredCandle, prevCandle, tooltipPosition, isVisible)가 `hoveredCandleAtom` 하나로 통합. 상태 값이 아닌 이벤트 핸들러만 반환.

---

## 5. 컴포넌트와 연결

### ChartContainer — 최상위 조율자

```tsx
const ChartContainer = () => {
  // ① 데이터 수급 시작 (atom에 쓰기)
  const { stats, loading, error, ... } = useChartData({ symbol, interval, limit });

  // ② 로딩 상태 확인 (dataLengthAtom 구독 — 새 캔들 추가 시에만 리렌더)
  const dataLength = useAtomValue(dataLengthAtom);

  if (loading && dataLength === 0) return <LoadingSpinner />;

  // ③ 차트 렌더링 위임
  return <CandlestickChart width={...} height={...} />;
};
```

### CandlestickChart — 렌더링 담당

```tsx
const CandlestickChart = ({ width, height }) => {
  // ① atom에서 직접 데이터 구독
  const chartData = useAtomValue(rawDataAtom);       // hover용
  const currentPrice = useAtomValue(currentPriceAtom); // 가격 표시
  const dataLength = useAtomValue(dataLengthAtom);     // 빈 데이터 체크

  // ② 차트 로직 (domain, range, visibleData, 팬/줌 핸들러)
  const chart = useChart(chartWidth, height);

  // ③ 캔버스에 캔들 그리기 (chart.visibleData 기반)
  useEffect(() => { /* canvas 렌더링 */ }, [chart.visibleData, ...]);

  // ④ 하위 컴포넌트 — 각자 atom 직접 구독
  return (
    <>
      <canvas ... />
      <HighLowLines />       {/* visibleDataAtom 직접 구독 */}
      <CurrentPriceLine />   {/* currentPriceAtom 직접 구독 */}
      <Crosshair />          {/* crosshairPositionAtom 직접 구독 */}
      <CandleTooltip />      {/* hoveredCandleAtom + tooltipVisibleAtom 직접 구독 */}
      <PriceAxis currentPrice={currentPrice} />
      <TimeAxis />           {/* indexDomainAtom 직접 구독 */}
    </>
  );
};
```

### 데이터가 화면에 그려지기까지

```
1. useChartData: REST fetch → rawDataAtom에 저장
2. useChartInit: rawDataAtom.length 감지 → initializeChartAtom 호출
3. initializeChartAtom: indexDomain, priceDomain, chartRange 설정
4. visibleDataAtom: rawData + indexDomain으로 보이는 캔들 계산
5. CandlestickChart의 useEffect: visibleData로 canvas에 캔들 그리기
6. CurrentPriceLine, PriceAxis 등: 각자 필요한 atom만 구독하여 렌더
```

---

## 6. 자주 하는 실수와 팁

### 실수 1: 전체 배열 구독

```ts
// ❌ rawDataAtom 전체를 구독 — WS 틱마다 리렌더
const data = useAtomValue(rawDataAtom);
return <div>{data[data.length - 1].close}</div>;

// ✅ 필요한 값만 파생 atom으로 구독
const price = useAtomValue(currentPriceAtom);
return <div>{price}</div>;
```

### 실수 2: 쓰기만 하는데 구독

```ts
// ❌ rawDataAtom을 구독하고 있어서 데이터 바뀔 때마다 리렌더
const [data, setData] = useAtom(rawDataAtom);
// setData만 쓰는데도 data 변경 시 리렌더 발생

// ✅ 쓰기 전용 — 구독 안 함
const setData = useSetAtom(rawDataAtom);
```

### 실수 3: 액션 atom의 get()을 구독으로 착각

```ts
// 액션 atom 내부의 get()은 "지금 값 읽기"일 뿐, 구독이 아님
const panXAtom = atom(null, (get, set, delta) => {
  const dataLength = get(rawDataAtom).length;  // ← 구독 아님! 현재 값만 읽음
  // ...
});

// 반면 파생 atom의 get()은 구독
const visibleDataAtom = atom((get) => {
  const data = get(rawDataAtom);  // ← 구독! rawDataAtom 바뀌면 재계산
  // ...
});
```

### 실수 4: 파생 atom에서 객체 반환 시 항상 리렌더

```ts
// ❌ 매번 새 객체 → 항상 리렌더
const statsAtom = atom((get) => ({
  price: get(rawDataAtom)[0]?.close,
  length: get(rawDataAtom).length,
}));

// ✅ 원시값(number, string) 반환 → 값이 같으면 리렌더 스킵
const currentPriceAtom = atom((get) => {
  const data = get(rawDataAtom);
  return data.length > 0 ? data[data.length - 1].close : null;
});
// 97000.5 === 97000.5 → 리렌더 안 함!
```

### 실수 5: 이벤트 핸들러에서 stale closure

```ts
// ❌ 드래그 중 domain이 stale (클로저에 갇힌 옛 값)
const domain = useAtomValue(indexDomainAtom);
const handleMouseMove = (e) => {
  console.log(domain);  // 마운트 시점의 domain!
};

// ✅ ref에 최신값 캐시
const domainRef = useRef(domain);
domainRef.current = domain;
const handleMouseMove = (e) => {
  console.log(domainRef.current);  // 항상 최신값
};
```

### 팁: Atom을 언제 분리해야 하는가?

```
하나의 atom이 적절한 경우:
  - 항상 함께 바뀌는 값 (예: { minPrice, maxPrice })
  - 항상 함께 읽히는 값

분리해야 하는 경우:
  - 독립적으로 바뀔 수 있는 값 (예: 15m 데이터 vs 4h 데이터)
  - 일부만 필요한 컴포넌트가 있는 경우
    (예: 전체 배열 vs 마지막 가격만)
```
