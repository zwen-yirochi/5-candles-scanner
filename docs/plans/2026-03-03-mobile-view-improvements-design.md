# Mobile View Improvements Design

## 1. 시간축 과도 확장 버그 수정

**근본 원인**: `actionAtoms.ts` `zoomXAtom`에서 `endIndex`가 `Math.min(dataLength - 1, ...)`로 클램핑되어 미래 여백이 사라짐. `MIN_ZOOM_RANGE: 10`이 너무 작아 극단적 줌 인 시 패닝 불가.

**수정**:
- `endIndex` 클램핑을 `maxEnd`(dataLength - 1 + MAX_FUTURE_BUFFER)로 변경
- `MIN_ZOOM_RANGE` 10 → 20 증가

**파일**: `src/stores/atoms/actionAtoms.ts`

## 2. 줌 기준점 개선 (데스크톱 + 모바일)

**현재**: 도메인 중앙 기준 줌. **변경**: 마우스/핀치 위치 기준 줌.

`zoomXAtom`에 `anchor` 파라미터 추가 (0~1 비율):
- 데스크톱 휠: 마우스 X / 차트 너비
- 모바일 핀치: 두 손가락 중심 X / 차트 너비
- 축 드래그: 기존 center 유지 (anchor 미전달)

**파일**: `src/stores/atoms/actionAtoms.ts`, `src/hooks/useChartPanZoom.ts`, `src/hooks/useTouchGestures.ts`, `src/hooks/useZoomDrag.ts`

## 3. 모바일 크로스헤어 탭 토글

**현재**: 500ms 롱프레스 활성화 → 손 떼면 1.5초 후 비활성화.
**변경**: 탭 토글 (탭→활성화, 재탭→비활성화). 활성화 중 손가락 이동 시 크로스헤어 따라감.

**파일**: `src/hooks/useTouchGestures.ts`

## 4. 모바일 UI 축소

| 컴포넌트 | 현재 (모바일) | 변경 (모바일) |
|----------|-------------|--------------|
| Select | text-sm, min-h-36px, py-2 | text-xs, min-h-28px, py-1 |
| Button sm | text-xs, min-h-36px, min-w-36px | text-[10px], min-h-28px, min-w-28px |
| PatternControlPanel | text-xs, px-2 py-1 | text-[10px], px-1.5 py-0.5 |
| PriceInfo 현재가 | text-2xl | text-xl |
| PriceInfo 라벨 | text-xs | text-[10px] |
| 헤더 패딩/갭 | p-2, gap-2, mb-3 | p-1.5, gap-1.5, mb-2 |

**파일**: `src/components/common/Button.tsx`, `src/components/common/Select.tsx`, `src/components/Chart/PatternControlPanel.tsx`, `src/components/Chart/ChartHeader/PriceInfo.tsx`, `src/components/Chart/ChartHeader/index.tsx`

## 5. High/Low 라벨 배경색 변경

**현재**: `bg-white border border-gray-300 rounded`
**변경**: `bg-gray-500/20 backdrop-blur-sm rounded` (보더 제거)

**파일**: `src/components/Chart/HighLowLines.tsx`
