import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { CandleData } from '../types/candle.types';
import { ChartDomain } from '../types/domain.types';
import { ChartRange } from '../types/range.types';
import { pixelToIndex } from '../utils/domainToRange';

const HOVER_DELAY = 500;
const TOUCH_END_DELAY = 2000;
const TOOLTIP_OFFSET = 10;

const TOOLTIP_DIMENSIONS = {
  WIDTH: 160,
  HEIGHT: 180,
} as const;

interface TooltipPosition {
  x: number;
  y: number;
}

interface UseCandleHoverResult {
  hoveredCandle: CandleData | null;
  prevCandle: CandleData | null;
  tooltipPosition: TooltipPosition;
  isVisible: boolean;
  handleMouseMove: (e: React.MouseEvent, chartRect: DOMRect) => void;
  handleMouseLeave: () => void;
  handleTouchStart: (e: React.TouchEvent, chartRect: DOMRect) => void;
  handleTouchMove: () => void;
  handleTouchEnd: () => void;
}

export const useCandleHover = (
  data: CandleData[],
  domain: ChartDomain,
  range: ChartRange,
  isDraggingRef: MutableRefObject<boolean>
): UseCandleHoverResult => {
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [prevCandle, setPrevCandle] = useState<CandleData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIndexRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    if (touchEndTimerRef.current) {
      clearTimeout(touchEndTimerRef.current);
      touchEndTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const calculateTooltipPosition = useCallback(
    (mouseX: number, mouseY: number, chartWidth: number, chartHeight: number): TooltipPosition => {
      let x = mouseX + TOOLTIP_OFFSET;
      let y = mouseY - TOOLTIP_DIMENSIONS.HEIGHT - TOOLTIP_OFFSET;

      // 오른쪽 경계 처리
      if (x + TOOLTIP_DIMENSIONS.WIDTH > chartWidth) {
        x = mouseX - TOOLTIP_DIMENSIONS.WIDTH - TOOLTIP_OFFSET;
      }

      // 상단 경계 처리
      if (y < 0) {
        y = mouseY + TOOLTIP_OFFSET;
      }

      // 하단 경계 처리
      if (y + TOOLTIP_DIMENSIONS.HEIGHT > chartHeight) {
        y = chartHeight - TOOLTIP_DIMENSIONS.HEIGHT - TOOLTIP_OFFSET;
      }

      return { x, y };
    },
    []
  );

  const showTooltip = useCallback(
    (index: number, mouseX: number, mouseY: number, chartWidth: number, chartHeight: number) => {
      if (index >= 0 && index < data.length) {
        setHoveredCandle(data[index]);
        setPrevCandle(index > 0 ? data[index - 1] : null);
        setTooltipPosition(calculateTooltipPosition(mouseX, mouseY, chartWidth, chartHeight));
        setIsVisible(true);
      }
    },
    [data, calculateTooltipPosition]
  );

  const hideTooltip = useCallback(() => {
    clearTimers();
    setIsVisible(false);
    setHoveredCandle(null);
    setPrevCandle(null);
    currentIndexRef.current = null;
  }, [clearTimers]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, chartRect: DOMRect) => {
      if (isDraggingRef.current) {
        hideTooltip();
        return;
      }

      const mouseX = e.clientX - chartRect.left;
      const mouseY = e.clientY - chartRect.top;

      const candleIndex = pixelToIndex(mouseX, domain.index, range);

      // 인덱스 범위 체크
      if (candleIndex < 0 || candleIndex >= data.length) {
        hideTooltip();
        return;
      }

      // 캔들 인덱스가 바뀌면 타이머 리셋
      if (candleIndex !== currentIndexRef.current) {
        clearTimers();
        setIsVisible(false);
        currentIndexRef.current = candleIndex;

        hoverTimerRef.current = setTimeout(() => {
          showTooltip(candleIndex, mouseX, mouseY, range.width, range.height);
        }, HOVER_DELAY);
      } else if (isVisible) {
        // 같은 캔들 위에서 마우스가 움직이면 툴팁 위치만 업데이트
        setTooltipPosition(calculateTooltipPosition(mouseX, mouseY, range.width, range.height));
      }
    },
    [isDraggingRef, domain.index, range, data.length, clearTimers, showTooltip, hideTooltip, isVisible, calculateTooltipPosition]
  );

  const handleMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, chartRect: DOMRect) => {
      if (isDraggingRef.current) return;

      const touch = e.touches[0];
      const touchX = touch.clientX - chartRect.left;
      const touchY = touch.clientY - chartRect.top;

      const candleIndex = pixelToIndex(touchX, domain.index, range);

      // 인덱스 범위 체크
      if (candleIndex < 0 || candleIndex >= data.length) {
        return;
      }

      currentIndexRef.current = candleIndex;

      clearTimers();

      touchTimerRef.current = setTimeout(() => {
        showTooltip(candleIndex, touchX, touchY, range.width, range.height);
      }, HOVER_DELAY);
    },
    [isDraggingRef, domain.index, range, data.length, clearTimers, showTooltip]
  );

  const handleTouchMove = useCallback(() => {
    // 터치 이동 시 타이머 취소 (드래그로 판단)
    clearTimers();
    if (isVisible) {
      hideTooltip();
    }
  }, [clearTimers, isVisible, hideTooltip]);

  const handleTouchEnd = useCallback(() => {
    clearTimers();
    // 툴팁이 표시된 상태에서 터치 종료 시 잠시 후 숨김
    if (isVisible) {
      touchEndTimerRef.current = setTimeout(() => {
        hideTooltip();
      }, TOUCH_END_DELAY);
    }
  }, [clearTimers, isVisible, hideTooltip]);

  return {
    hoveredCandle,
    prevCandle,
    tooltipPosition,
    isVisible,
    handleMouseMove,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
