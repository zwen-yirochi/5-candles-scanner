import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isDraggingAtom } from '../stores/atoms/interactionAtoms';

type DragDirection = 'horizontal' | 'vertical';

interface UseZoomDragParams {
    onZoom: (factor: number) => void;
    sensitivity?: number;
    direction: DragDirection;
}

export const useZoomDrag = ({ onZoom, sensitivity = 0.01, direction }: UseZoomDragParams) => {
    const [isDragging, setIsDragging] = useState(false);
    const setGlobalDragging = useSetAtom(isDraggingAtom);
    const dragStartRef = useRef(0);
    const isDraggingRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);

    // ref 패턴: onZoom이 바뀌어도 리스너 재등록 불필요
    const onZoomRef = useRef(onZoom);
    onZoomRef.current = onZoom;

    const sensitivityRef = useRef(sensitivity);
    sensitivityRef.current = sensitivity;

    // ━━━ 마우스 핸들러 (기존) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            isDraggingRef.current = true;
            setIsDragging(true);
            setGlobalDragging(true);
            dragStartRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
        },
        [direction, setGlobalDragging]
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
        setGlobalDragging(false);
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }, [setGlobalDragging]);

    // ━━━ 터치 핸들러 (신규) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (e.touches.length !== 1) return;
            // preventDefault 불필요: touchAction: 'none' CSS가 브라우저 기본 동작 방지
            isDraggingRef.current = true;
            setIsDragging(true);
            setGlobalDragging(true);
            const touch = e.touches[0];
            dragStartRef.current = direction === 'horizontal' ? touch.clientX : touch.clientY;
        },
        [direction, setGlobalDragging]
    );

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (!isDraggingRef.current || e.touches.length !== 1) return;

            if (rafIdRef.current !== null) return;

            rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = null;

                const touch = e.touches[0];
                const currentPos = direction === 'horizontal' ? touch.clientX : touch.clientY;
                const delta = currentPos - dragStartRef.current;
                const zoomFactor = 1 + delta * sensitivityRef.current;

                onZoomRef.current(zoomFactor);
                dragStartRef.current = currentPos;
            });
        },
        [direction]
    );

    const handleTouchEnd = useCallback(() => {
        isDraggingRef.current = false;
        setIsDragging(false);
        setGlobalDragging(false);
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }, [setGlobalDragging]);

    // ━━━ 글로벌 리스너 등록 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    return {
        isDragging,
        handleMouseDown,
        handleTouchStart,
    };
};
