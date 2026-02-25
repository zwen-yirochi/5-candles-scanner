import { useAtom, useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { useZoomDrag } from '../../hooks/useZoomDrag';
import { chartDimensionsAtom, intervalAtom, intervalMsAtom } from '../../stores/atoms/chartConfigAtoms';
import { baseTimestampAtom } from '../../stores/atoms/dataAtoms';
import { indexDomainAtom } from '../../stores/atoms/domainAtoms';
import { getTimeLabels } from '../../utils/timeLabels';

const TIME_AXIS_HEIGHT = 60;

export const TimeAxis: React.FC = () => {
  const { width } = useAtomValue(chartDimensionsAtom);
  const [indexDomain, setIndexDomain] = useAtom(indexDomainAtom);
  const baseTimestamp = useAtomValue(baseTimestampAtom);
  const intervalMs = useAtomValue(intervalMsAtom);
  const interval = useAtomValue(intervalAtom);

  const labels = useMemo(() => {
    if (baseTimestamp === null) return [];
    const startTime = baseTimestamp + indexDomain.startIndex * intervalMs;
    const endTime = baseTimestamp + indexDomain.endIndex * intervalMs;
    return getTimeLabels(startTime, endTime, width);
  }, [indexDomain, baseTimestamp, intervalMs, width]);

  const handleZoom = (factor: number) => {
    const fixedEnd = indexDomain.endIndex;
    const currentRange = indexDomain.endIndex - indexDomain.startIndex;
    const newRange = currentRange * factor;

    if (newRange < 10) return;
    if (newRange > fixedEnd + 1) return;

    setIndexDomain({
      startIndex: Math.max(0, fixedEnd - newRange),
      endIndex: fixedEnd,
    });
  };

  const { isDragging, handleMouseDown, handleTouchStart } = useZoomDrag({
    onZoom: handleZoom,
    sensitivity: 0.01,
    direction: 'horizontal',
  });

  return (
    <div
      className={`relative overflow-hidden bg-[#F5F5F0] border-t border-gray-200
                cursor-ew-resize select-none transition-colors ${
                  isDragging ? 'bg-[#EDEDEA]' : 'hover:bg-[#EFEFEA]'
                }`}
      style={{ width, height: TIME_AXIS_HEIGHT, touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="absolute inset-x-0 flex items-center justify-center gap-1 top-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-gray-300 rounded-full" />
        ))}
      </div>

      {labels.map((item) => (
        <div
          key={item.timestamp}
          className="absolute bottom-1 flex flex-col items-center -translate-x-1/2"
          style={{ left: item.x }}
        >
          <div className="w-px h-2 mb-1 bg-gray-400" />
          <div className="px-2 py-0.5 text-xs font-mono text-gray-500 whitespace-nowrap">
            {item.text}
          </div>
        </div>
      ))}

      <div className="absolute w-px h-full bg-gray-300 opacity-30" style={{ right: 0 }} />

      <div className="absolute px-2 py-1 text-xs text-gray-500 bg-gray-200 rounded-full top-2 left-2">
        {interval} 간격
      </div>
    </div>
  );
};
