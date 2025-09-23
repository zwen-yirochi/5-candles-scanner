import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { autoFitYAtom, initializeChartAtom, zoomXAtom } from '../stores/atoms/actionAtoms';
import { visibleDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom, indexDomainAtom } from '../stores/atoms/domainAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { CandleData } from '../types';

export const useChart = (data: CandleData[], width: number, height: number) => {
    const domain = useAtomValue(chartDomainAtom);
    const range = useAtomValue(chartRangeAtom);
    const visibleData = useAtomValue(visibleDataAtom);
    const [indexDomain, setIndexDomain] = useAtom(indexDomainAtom);

    const initializeChart = useSetAtom(initializeChartAtom);
    const zoomX = useSetAtom(zoomXAtom);
    const autoFitY = useSetAtom(autoFitYAtom);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);

    useEffect(() => {
        if (data.length > 0) {
            initializeChart({ data, width, height });
        }
    }, [data, width, height, initializeChart]);

    // 드래그 시작
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart(e.clientX);
    }, []);

    // 드래그 중
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;

            const deltaX = e.clientX - dragStart;
            const indexRange = indexDomain.endIndex - indexDomain.startIndex;
            const indexPerPixel = indexRange / width;
            const indexDelta = -deltaX * indexPerPixel;

            const newStart = indexDomain.startIndex + indexDelta;
            const newEnd = indexDomain.endIndex + indexDelta;

            // 왼쪽 경계만 체크 (오른쪽은 자유롭게)
            if (newStart >= 0) {
                setIndexDomain({
                    startIndex: newStart,
                    endIndex: newEnd,
                });
            }

            setDragStart(e.clientX);
        },
        [isDragging, dragStart, indexDomain, width, setIndexDomain]
    );

    // 드래그 종료
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.1 : 0.9;
            zoomX(factor);
            setTimeout(() => autoFitY(), 0);
        },
        [zoomX, autoFitY]
    );

    return {
        domain,
        range,
        visibleData,
        handleWheel,
        handleMouseDown,
        isDragging,
        autoFitY,
    };
};
