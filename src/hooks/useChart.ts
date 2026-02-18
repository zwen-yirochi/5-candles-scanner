import { useChartInit } from './useChartInit';
import { useChartPanZoom } from './useChartPanZoom';

export const useChart = (width: number, height: number) => {
  const { domain, range, visibleData } = useChartInit(width, height);
  const { handleWheel, handleMouseDown, isDraggingRef, autoFitY } = useChartPanZoom();

  return {
    domain,
    range,
    visibleData,
    handleWheel,
    handleMouseDown,
    isDraggingRef,
    autoFitY,
  };
};
