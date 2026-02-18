import { useCallback, useEffect, useRef, useState } from 'react';

type DragDirection = 'horizontal' | 'vertical';

interface UseZoomDragParams {
    onZoom: (factor: number) => void;
    sensitivity?: number;
    direction: DragDirection;
}

export const useZoomDrag = ({ onZoom, sensitivity = 0.01, direction }: UseZoomDragParams) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef(0);
    const isDraggingRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);

    // ref 패턴: onZoom이 바뀌어도 리스너 재등록 불필요
    const onZoomRef = useRef(onZoom);
    onZoomRef.current = onZoom;

    const sensitivityRef = useRef(sensitivity);
    sensitivityRef.current = sensitivity;

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            isDraggingRef.current = true;
            setIsDragging(true);
            dragStartRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
        },
        [direction]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDraggingRef.current) return;

            if (rafIdRef.current !== null) return;

            rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = null;

                const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
                const delta = currentPos - dragStartRef.current;
                const zoomFactor = 1 + delta * sensitivityRef.current;

                onZoomRef.current(zoomFactor);
                dragStartRef.current = currentPos;
            });
        },
        [direction]
    );

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        setIsDragging(false);
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [handleMouseMove, handleMouseUp]);

    return {
        isDragging,
        handleMouseDown,
    };
};
