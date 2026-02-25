import { useAtomValue } from 'jotai';
import React, { useRef } from 'react';
import { CHART_COLORS } from '../../constants/chart.constants';
import { useCandleHover } from '../../hooks/useCandleHover';
import { useChartPanZoom } from '../../hooks/useChartPanZoom';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';

export const ChartArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { handleWheel, handleMouseDown } = useChartPanZoom();
  const candleHover = useCandleHover(chartContainerRef);
  const touchGestures = useTouchGestures({ containerRef: chartContainerRef });

  return (
    <div
      ref={chartContainerRef}
      className={`relative overflow-hidden ${CHART_COLORS.BACKGROUND}`}
      style={{ width, height, touchAction: 'none' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={candleHover.handleMouseMove}
      onMouseLeave={candleHover.handleMouseLeave}
      onTouchStart={touchGestures.handleTouchStart}
      onTouchMove={touchGestures.handleTouchMove}
      onTouchEnd={touchGestures.handleTouchEnd}
    >
      {children}
    </div>
  );
};
