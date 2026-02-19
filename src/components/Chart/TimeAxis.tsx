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

  const { isDragging, handleMouseDown } = useZoomDrag({
    onZoom: handleZoom,
    sensitivity: 0.01,
    direction: 'horizontal',
  });

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900 border-t-2 border-gray-600
                cursor-ew-resize select-none transition-colors ${
                  isDragging ? 'bg-blue-900' : 'hover:from-gray-700 hover:to-gray-800'
                }`}
      style={{ width, height: TIME_AXIS_HEIGHT }}
      onMouseDown={handleMouseDown}
    >
      <div className="absolute inset-x-0 flex items-center justify-center gap-1 top-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-gray-500 rounded-full" />
        ))}
      </div>

      {labels.map((item) => (
        <div
          key={item.timestamp}
          className="absolute bottom-1 flex flex-col items-center -translate-x-1/2"
          style={{ left: item.x }}
        >
          <div className="w-px h-2 mb-1 bg-gray-500" />
          <div className="px-2 py-0.5 text-xs font-mono text-gray-200 bg-gray-800 rounded whitespace-nowrap">
            {item.text}
          </div>
        </div>
      ))}

      <div className="absolute w-px h-full bg-red-500 opacity-30" style={{ right: 0 }} />

      <div className="absolute px-2 py-1 text-xs text-gray-400 bg-gray-900 rounded top-2 left-2">
        {interval} 간격
      </div>
    </div>
  );
};
