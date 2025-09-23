import { useCallback, useEffect, useState } from 'react';

type DragDirection = 'horizontal' | 'vertical';

interface UseZoomDragParams {
    onZoom: (factor: number) => void;
    sensitivity?: number;
    direction: DragDirection;
}

export const useZoomDrag = ({ onZoom, sensitivity = 0.01, direction }: UseZoomDragParams) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);

    // 드래그 시작
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsDragging(true);
            setDragStart(direction === 'horizontal' ? e.clientX : e.clientY);
        },
        [direction]
    );

    // 드래그 중
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;

            const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
            const delta = currentPos - dragStart;
            const zoomFactor = 1 + delta * sensitivity;

            onZoom(zoomFactor);
            setDragStart(currentPos);
        },
        [isDragging, dragStart, direction, sensitivity, onZoom]
    );

    // 드래그 종료
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 이벤트 리스너
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

    return {
        isDragging,
        handleMouseDown,
    };
};
