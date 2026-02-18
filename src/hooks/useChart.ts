import { useChartInit } from './useChartInit';
import { useChartPanZoom } from './useChartPanZoom';

export const useChart = (width: number, height: number) => {
  const { domain, range, visibleData } = useChartInit(width, height);
  const { handleWheel, handleMouseDown, autoFitY } = useChartPanZoom();

  return {
    domain,
    range,
    visibleData,
    handleWheel,
    handleMouseDown,
    autoFitY,
  };
};
