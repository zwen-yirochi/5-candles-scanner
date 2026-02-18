import { atom } from 'jotai';
import { CandleData } from '../../types/candle.types';

// ━━━ isDragging ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 소스: useChartPanZoom (차트 드래그), useZoomDrag (축 드래그)
// 소비: useCandleHover (툴팁 억제), tooltipVisibleAtom (파생)
// 빈도: 낮음 (mousedown/mouseup 전환 시에만)
export const isDraggingAtom = atom(false);

// ━━━ Crosshair 위치 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 차트 컨테이너 내 픽셀 좌표. null = 마우스가 차트 밖.
// 현재 Crosshair가 이미 useState로 매 mousemove마다 리렌더하므로 성능 동등.
export const crosshairPositionAtom = atom<{ x: number; y: number } | null>(null);

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
