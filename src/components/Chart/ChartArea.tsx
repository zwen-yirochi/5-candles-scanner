import { useAtomValue } from 'jotai';
import React, { useEffect, useRef } from 'react';
import { CHART_COLORS } from '../../constants/chart.constants';
import { useCandleHover } from '../../hooks/useCandleHover';
import { useChartPanZoom } from '../../hooks/useChartPanZoom';
import { useEditorInteraction } from '../../hooks/useEditorInteraction';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import { drawingObjectsAtom } from '../../stores/atoms/editorAtoms';

export const ChartArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height }  = useAtomValue(chartDimensionsAtom);
  const drawingObjects      = useAtomValue(drawingObjectsAtom);
  const chartContainerRef   = useRef<HTMLDivElement>(null);
  const { handleWheel, handleMouseDown } = useChartPanZoom();
  const candleHover         = useCandleHover(chartContainerRef);
  const touchGestures       = useTouchGestures({ containerRef: chartContainerRef });
  const editor              = useEditorInteraction();

  useEffect(() => {
    editor.syncDrawingObjects(drawingObjects);
  }, [drawingObjects, editor.syncDrawingObjects]);

  return (
    <div
      ref={chartContainerRef}
      className={`relative overflow-hidden ${CHART_COLORS.BACKGROUND}`}
      style={{ width, height, touchAction: 'none' }}
      onWheel={handleWheel}
      onMouseDown={editor.isDrawMode || editor.isSelectMode ? undefined : handleMouseDown}
      onPointerDown={(e) => {
        editor.handlePanModeClick(e);
        editor.handlePointerDown(e);
      }}
      onPointerMove={editor.handlePointerMove}
      onPointerUp={editor.handlePointerUp}
      onMouseMove={editor.isDrawMode ? undefined : candleHover.handleMouseMove}
      onMouseLeave={editor.isDrawMode || editor.isSelectMode ? undefined : candleHover.handleMouseLeave}
      onTouchStart={editor.isDrawMode || editor.isSelectMode ? undefined : touchGestures.handleTouchStart}
      onTouchMove={editor.isDrawMode || editor.isSelectMode ? undefined : touchGestures.handleTouchMove}
      onTouchEnd={editor.isDrawMode || editor.isSelectMode ? undefined : touchGestures.handleTouchEnd}
    >
      {children}
    </div>
  );
};
