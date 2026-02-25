import { useAtomValue, useSetAtom } from 'jotai';
import { RefObject, useCallback, useEffect, useRef } from 'react';
import { hoveredCandleAtom, isDraggingAtom } from '../stores/atoms/interactionAtoms';
import { rawDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom } from '../stores/atoms/domainAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { indexToPixel, pixelToIndex, priceToPixel } from '../utils/domainToRange';

const HOVER_DELAY = 500;
const TOOLTIP_OFFSET = 10;

const TOOLTIP_DIMENSIONS = {
  WIDTH: 160,
  HEIGHT: 180,
} as const;

interface TooltipPosition {
  x: number;
  y: number;
}

const calculateTooltipPosition = (
  mouseX: number,
  mouseY: number,
  chartWidth: number,
  chartHeight: number
): TooltipPosition => {
  let x = mouseX + TOOLTIP_OFFSET;
  let y = mouseY - TOOLTIP_DIMENSIONS.HEIGHT - TOOLTIP_OFFSET;

  if (x + TOOLTIP_DIMENSIONS.WIDTH > chartWidth) {
    x = mouseX - TOOLTIP_DIMENSIONS.WIDTH - TOOLTIP_OFFSET;
  }

  if (y < 0) {
    y = mouseY + TOOLTIP_OFFSET;
  }

  if (y + TOOLTIP_DIMENSIONS.HEIGHT > chartHeight) {
    y = chartHeight - TOOLTIP_DIMENSIONS.HEIGHT - TOOLTIP_OFFSET;
  }

  return { x, y };
};

export const useCandleHover = (containerRef: RefObject<HTMLDivElement | null>) => {
  const data = useAtomValue(rawDataAtom);
  const domain = useAtomValue(chartDomainAtom);
  const range = useAtomValue(chartRangeAtom);
  const isDragging = useAtomValue(isDraggingAtom);
  const setHoveredCandle = useSetAtom(hoveredCandleAtom);

  const isShowingRef = useRef(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIndexRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const showTooltip = useCallback(
    (index: number) => {
      if (index >= 0 && index < data.length) {
        const candle = data[index];
        const candleWidth = range.width / (domain.index.endIndex - domain.index.startIndex);
        const anchorX = indexToPixel(index, domain.index, range) + candleWidth / 2;
        const anchorY = priceToPixel(candle.high, domain.price, range);

        setHoveredCandle({
          candle,
          prevCandle: index > 0 ? data[index - 1] : null,
          tooltipPosition: calculateTooltipPosition(anchorX, anchorY, range.width, range.height),
        });
        isShowingRef.current = true;
      }
    },
    [data, domain, range, setHoveredCandle]
  );

  const hideTooltip = useCallback(() => {
    clearTimers();
    setHoveredCandle(null);
    isShowingRef.current = false;
    currentIndexRef.current = null;
  }, [clearTimers, setHoveredCandle]);

  // 드래그 시작 시 자동 숨김
  useEffect(() => {
    if (isDragging) {
      hideTooltip();
    }
  }, [isDragging, hideTooltip]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging || !containerRef.current) return;

      const chartRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - chartRect.left;
      const candleIndex = pixelToIndex(mouseX, domain.index, range);

      // 인덱스 범위 체크
      if (candleIndex < 0 || candleIndex >= data.length) {
        hideTooltip();
        return;
      }

      // 캔들 인덱스가 바뀌면 타이머 리셋
      if (candleIndex !== currentIndexRef.current) {
        if (isShowingRef.current) {
          hideTooltip();
        } else {
          clearTimers();
        }
        currentIndexRef.current = candleIndex;

        hoverTimerRef.current = setTimeout(() => {
          showTooltip(candleIndex);
        }, HOVER_DELAY);
      }
    },
    [isDragging, containerRef, domain.index, range, data.length, clearTimers, showTooltip, hideTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  return {
    handleMouseMove,
    handleMouseLeave,
  };
};
