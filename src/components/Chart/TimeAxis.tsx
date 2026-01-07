import { useAtom, useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { useZoomDrag } from '../../hooks/useZoomDrag';
import { rawDataAtom } from '../../stores/atoms/dataAtoms';
import { indexDomainAtom } from '../../stores/atoms/domainAtoms';
import { findClosestDataIndex, formatTimestamp, getVisibleTimeLabels } from '../../utils/timeLabels';

interface TimeAxisProps {
  width: number;
  height?: number;
}

export const TimeAxis: React.FC<TimeAxisProps> = ({ width, height = 60 }) => {
  const [indexDomain, setIndexDomain] = useAtom(indexDomainAtom);
  const data = useAtomValue(rawDataAtom);

  // 보이는 라벨 계산
  const { labelData, interval } = useMemo(() => {
    const { timestamps, format, interval } = getVisibleTimeLabels(
      data,
      indexDomain.startIndex,
      indexDomain.endIndex,
      8,
    );

    const indexRange = indexDomain.endIndex - indexDomain.startIndex;

    return {
      labelData: timestamps.map((ts) => {
        const index = findClosestDataIndex(
          data,
          ts,
          Math.floor(indexDomain.startIndex),
          Math.ceil(indexDomain.endIndex),
        );

        return {
          timestamp: ts,
          index,
          x: ((index - indexDomain.startIndex) / indexRange) * width,
          label: formatTimestamp(ts, format),
        };
      }),
      format,
      interval,
    };
  }, [indexDomain, data, width]);

  // 줌 함수
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

  const intervalText = useMemo(() => {
    if (interval >= 86400000) return `${interval / 86400000}일`;
    if (interval >= 3600000) return `${interval / 3600000}시간`;
    if (interval >= 60000) return `${interval / 60000}분`;
    return `${interval / 1000}초`;
  }, [interval]);

  return (
    <div
      className={`relative bg-gradient-to-b from-gray-800 to-gray-900 border-t-2 border-gray-600 
                cursor-ew-resize select-none transition-colors ${
                  isDragging ? 'bg-blue-900' : 'hover:from-gray-700 hover:to-gray-800'
                }`}
      style={{ width, height }}
      onMouseDown={handleMouseDown}
    >
      {/* 드래그 인디케이터 */}
      <div className="absolute inset-x-0 flex items-center justify-center gap-1 top-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-gray-500 rounded-full" />
        ))}
      </div>

      {/* 시간 라벨 */}
      <div className="absolute inset-x-0 bottom-2">
        {labelData.map((item, i) => (
          <div
            key={item.timestamp}
            className="absolute flex flex-col items-center transform -translate-x-1/2"
            style={{ left: `${item.x}px` }}
          >
            <div className="w-px h-2 mb-1 bg-gray-500" />
            <div className="px-2 py-0.5 text-xs font-mono text-gray-200 bg-gray-800 rounded whitespace-nowrap">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* 고정점 */}
      <div className="absolute w-px h-full bg-red-500 opacity-30" style={{ right: '0px' }} />

      {/* 간격 정보 */}
      <div className="absolute px-2 py-1 text-xs text-gray-400 bg-gray-900 rounded top-2 left-2">
        {intervalText} 간격
      </div>
    </div>
  );
};
