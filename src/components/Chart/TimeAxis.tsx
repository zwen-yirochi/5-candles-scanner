import { useAtom, useAtomValue } from 'jotai';
import React from 'react';
import { useZoomDrag } from '../../hooks/useZoomDrag';
import { rawDataAtom } from '../../stores/atoms/dataAtoms';
import { indexDomainAtom } from '../../stores/atoms/domainAtoms';

interface TimeAxisProps {
    width: number;
    height?: number;
}

export const TimeAxis: React.FC<TimeAxisProps> = ({ width, height = 60 }) => {
    const [indexDomain, setIndexDomain] = useAtom(indexDomainAtom);
    const data = useAtomValue(rawDataAtom);

    // 줌 함수 - endIndex 고정, startIndex만 조절
    const handleZoom = (factor: number) => {
        const fixedEnd = indexDomain.endIndex; // 오른쪽 끝 고정
        const currentRange = indexDomain.endIndex - indexDomain.startIndex;
        const newRange = currentRange * factor;

        // 최소/최대 범위 제한
        if (newRange < 10) return;
        if (newRange > fixedEnd + 1) return;

        const newStart = fixedEnd - newRange;

        setIndexDomain({
            startIndex: Math.max(0, newStart),
            endIndex: fixedEnd,
        });
    };

    const { isDragging, handleMouseDown } = useZoomDrag({
        onZoom: handleZoom,
        sensitivity: 0.01,
        direction: 'horizontal', // 좌우 드래그
    });

    // 시간 포맷
    const formatTime = (index: number) => {
        if (!data[Math.floor(index)]) return '';
        const timestamp = data[Math.floor(index)].timestamp;
        return new Date(timestamp).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
        });
    };

    return (
        <div
            className={`relative bg-gradient-to-b from-gray-100 to-gray-200 border-t-2 border-gray-300 
                cursor-ew-resize select-none transition-colors ${
                    isDragging ? 'bg-blue-100' : 'hover:from-gray-200 hover:to-gray-300'
                }`}
            style={{ width, height }}
            onMouseDown={handleMouseDown}
        >
            {/* 정보 표시 */}
            <div className="absolute inset-x-0 flex items-center justify-between px-4 text-sm bottom-2">
                <div className="flex flex-col items-start">
                    <span className="font-mono text-gray-700">{formatTime(indexDomain.startIndex)}</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="font-mono text-gray-700">{formatTime(indexDomain.endIndex)}</span>
                </div>
            </div>
        </div>
    );
};
