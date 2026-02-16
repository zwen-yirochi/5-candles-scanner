import { CandleData } from '../types';
import { useChartInit } from './useChartInit';
import { useChartPanZoom } from './useChartPanZoom';

export const useChart = (data: CandleData[], width: number, height: number) => {
  const { domain, range, visibleData } = useChartInit(data, width, height);
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
