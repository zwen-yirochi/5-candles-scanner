# 🚀 성능 최적화 가이드

## 📊 1단계: 성능 측정 방법

### 1-1. React DevTools Profiler 사용

```bash
# React DevTools 설치 (Chrome Extension)
# https://chrome.google.com/webstore/detail/react-developer-tools/

# 사용법:
# 1. 개발자 도구 열기 (F12)
# 2. "Profiler" 탭 선택
# 3. 녹화 버튼 클릭
# 4. 차트를 드래그/줌/스크롤
# 5. 녹화 중지 후 분석
```

**체크 포인트:**
- Commit 시간이 16ms(60fps) 이하인가?
- 불필요한 리렌더링이 발생하는 컴포넌트는?
- 가장 느린 컴포넌트는?

---

### 1-2. 실시간 FPS 모니터 사용

**App.tsx에 PerformanceMonitor 추가:**

```tsx
import { PerformanceMonitor } from './components/PerformanceMonitor';

function App() {
  return (
    <>
      <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
      {/* 나머지 컴포넌트 */}
    </>
  );
}
```

**측정 시나리오:**
1. 차트 로딩 후 가만히 있을 때 FPS
2. 마우스 드래그 시 FPS
3. 휠 줌 시 FPS
4. WebSocket으로 실시간 데이터 수신 시 FPS

**목표:**
- 정적 상태: 60 FPS
- 드래그/줌: 45-60 FPS
- 실시간 업데이트: 55+ FPS

---

### 1-3. Chrome DevTools Performance 탭

```bash
# 사용법:
# 1. 개발자 도구 > Performance 탭
# 2. 녹화 시작
# 3. 차트 인터랙션 (드래그, 줌 등)
# 4. 녹화 중지
# 5. 프레임 타임라인 분석

# 확인 사항:
# - Scripting 시간 (노란색)
# - Rendering 시간 (보라색)
# - Painting 시간 (초록색)
# - 긴 작업 (Long Tasks) - 50ms 이상
```

---

### 1-4. 메모리 프로파일링

**Chrome DevTools Memory 탭:**
1. 힙 스냅샷 촬영
2. 차트 조작 (5분간)
3. 다시 힙 스냅샷 촬영
4. 비교 분석

**체크 포인트:**
- 메모리 누수가 있는가?
- Detached DOM이 증가하는가?
- 불필요한 객체가 쌓이는가?

---

### 1-5. 컴포넌트별 렌더링 추적

**usePerformanceMonitor Hook 사용:**

```tsx
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

export const CandlestickChart: React.FC<Props> = (props) => {
  usePerformanceMonitor('CandlestickChart', true);
  // ...
};
```

**useWhyDidYouUpdate Hook으로 리렌더링 원인 추적:**

```tsx
import { useWhyDidYouUpdate } from '../hooks/usePerformanceMonitor';

export const Candlestick: React.FC<Props> = (props) => {
  useWhyDidYouUpdate('Candlestick', props);
  // ...
};
```

---

## 🔧 2단계: 성능 병목 지점 식별

### 현재 프로젝트의 주요 병목 지점:

#### 1. **useChart의 handleMouseMove** (src/hooks/useChart.ts:61-100)
```tsx
// 문제: 마우스 움직임마다 상태 업데이트
// - 초당 100번 이상 발생 가능
// - 매번 setIndexDomain, setPriceDomain 호출
// - 전체 차트 리렌더링 유발
```

#### 2. **Candlestick 컴포넌트 다중 렌더링**
```tsx
// 문제: visibleData.map()으로 렌더링
// - 100개 캔들 = 100개 DOM 노드
// - 드래그 시 모든 캔들 재렌더링
// - React.memo 미적용
```

#### 3. **Crosshair 컴포넌트** (src/components/Chart/Crosshair.tsx)
```tsx
// 문제: 마우스 이동마다 리렌더링
// - 실시간 가격/시간 계산
// - DOM 업데이트 빈도 과다
```

#### 4. **visibleDataAtom 재계산**
```tsx
// 문제: indexDomain 변경 시마다 재계산
// - slice() 연산 반복
// - 참조 변경으로 하위 컴포넌트 리렌더링
```

---

## 🎯 3단계: 개선 방향

### 우선순위 1: 드래그 성능 개선 (High Impact)

**문제:** 마우스 움직임마다 상태 업데이트 → 모든 컴포넌트 리렌더링

**해결책:**
1. **Throttle/Debounce 적용**
2. **requestAnimationFrame으로 상태 업데이트 제한**
3. **Transform 기반 이동 (상태 업데이트 없이)**

---

### 우선순위 2: 컴포넌트 메모이제이션 (Medium Impact)

**해결책:**
- `React.memo()` 적용
- `useMemo()`로 무거운 계산 캐싱
- `useCallback()`으로 함수 참조 고정

---

### 우선순위 3: Canvas 렌더링 전환 (High Impact, High Effort)

**현재:** DOM 기반 렌더링 (100개 Candlestick = 100개 div)
**개선:** Canvas 기반 렌더링

**장점:**
- 단일 Canvas 요소
- GPU 가속
- 수천 개 캔들도 60fps 유지

---

### 우선순위 4: 가상화 (Virtualization)

**해결책:**
- 보이는 영역의 캔들만 렌더링
- react-window 또는 직접 구현

---

### 우선순위 5: WebWorker 활용

**해결책:**
- 패턴 분석을 WebWorker로 분리
- 메인 스레드 부하 감소

---

## 📈 성능 측정 체크리스트

### Before 측정
- [ ] React Profiler로 초기 렌더링 시간 측정
- [ ] 드래그 시 FPS 측정 (10초간)
- [ ] 줌 시 FPS 측정 (10초간)
- [ ] 메모리 사용량 측정 (초기)
- [ ] Chrome Performance 프로파일 저장

### After 측정
- [ ] 동일 조건에서 재측정
- [ ] 개선 비율 계산 (%)
- [ ] 회귀 테스트 (기능 정상 작동)

---

## 🎬 측정 시작하기

### 1. PerformanceMonitor 활성화

```tsx
// src/App.tsx
import { PerformanceMonitor } from './components/PerformanceMonitor';

<PerformanceMonitor enabled={true} />
```

### 2. 콘솔 확인

개발자 도구 콘솔에서 다음 정보 확인:
- FPS 통계
- 메모리 사용량
- 리렌더링 횟수

### 3. 시나리오별 측정

**시나리오 1: 정적 차트**
- 차트 로딩 후 10초 대기
- FPS: 목표 60

**시나리오 2: 드래그**
- 좌우로 10초간 드래그
- FPS: 목표 45+

**시나리오 3: 줌**
- 10초간 줌 인/아웃
- FPS: 목표 50+

**시나리오 4: 실시간 업데이트**
- WebSocket 연결 후 1분 대기
- FPS: 목표 55+

---

## 📝 성능 리포트 템플릿

```markdown
## 성능 측정 결과

### 환경
- 브라우저: Chrome 131
- OS: Windows 11
- CPU: [CPU 모델]
- 메모리: [RAM 크기]

### Before (개선 전)
- 정적 FPS: XX fps
- 드래그 FPS: XX fps
- 줌 FPS: XX fps
- 초기 메모리: XX MB
- 렌더링 시간: XX ms

### After (개선 후)
- 정적 FPS: XX fps (+XX%)
- 드래그 FPS: XX fps (+XX%)
- 줌 FPS: XX fps (+XX%)
- 초기 메모리: XX MB (-XX%)
- 렌더링 시간: XX ms (-XX%)

### 개선 사항
1. [개선 내용]
2. [개선 내용]

### 추가 개선 필요 사항
- [ ] [내용]
```

---

## 🚦 다음 단계

1. ✅ 성능 측정 도구 설치 완료
2. 📊 현재 성능 측정 (Before)
3. 🔧 개선 작업 시작
4. 📈 개선 후 측정 (After)
5. 📝 성능 리포트 작성
