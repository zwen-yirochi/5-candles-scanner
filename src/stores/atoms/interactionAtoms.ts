import { atom } from 'jotai';
import { CandleData } from '../../types/candle.types';

// ━━━ isDragging ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 소스: useChartPanZoom (차트 드래그), useZoomDrag (축 드래그)
// 소비: useCandleHover (툴팁 억제), tooltipVisibleAtom (파생)
// 빈도: 낮음 (mousedown/mouseup 전환 시에만)
export const isDraggingAtom = atom(false);

// ━━━ 호버된 캔들 상태 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export interface HoveredCandleState {
  candle: CandleData;
  prevCandle: CandleData | null;
  tooltipPosition: { x: number; y: number };
}
// candle + prevCandle + position이 항상 함께 변경되므로 하나의 atom으로 통합
export const hoveredCandleAtom = atom<HoveredCandleState | null>(null);

// ━━━ 툴팁 가시성 (파생) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 핵심 이점: isDragging과 hoveredCandle의 조합을 선언적으로 표현
export const tooltipVisibleAtom = atom((get) => {
  return get(hoveredCandleAtom) !== null && !get(isDraggingAtom);
});

// ━━━ 크로스헤어 위치 (마우스/터치 통합) ━━━━━━━━━━━━━━━━━━━━━
// 소스: Crosshair (마우스), useTouchGestures (터치 롱프레스)
// 소비: Crosshair 컴포넌트 (렌더링)
export interface CrosshairPosition {
  x: number;
  y: number;
  source: 'mouse' | 'touch';
}
export const crosshairPositionAtom = atom<CrosshairPosition | null>(null);

// ━━━ 크로스헤어 활성 상태 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 터치 롱프레스 크로스헤어 활성 중에는 팬 동작을 억제
export const isCrosshairActiveAtom = atom(false);
