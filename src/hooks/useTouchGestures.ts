import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { RefObject, useCallback, useEffect, useRef } from 'react';
import { zoomXAtom } from '../stores/atoms/actionAtoms';
import { indexDomainAtom, priceDomainAtom } from '../stores/atoms/domainAtoms';
import {
  crosshairPositionAtom,
  isCrosshairActiveAtom,
  isDraggingAtom,
} from '../stores/atoms/interactionAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';

type GestureState = 'idle' | 'pending' | 'panning' | 'crosshair' | 'pinching';

const LONG_PRESS_DELAY = 500;
const PAN_THRESHOLD = 5;
const CROSSHAIR_LINGER_DELAY = 1500;

function getDistance(t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

interface UseTouchGesturesParams {
  containerRef: RefObject<HTMLDivElement | null>;
}

export const useTouchGestures = ({ containerRef }: UseTouchGesturesParams) => {
  const range = useAtomValue(chartRangeAtom);
  const [indexDomain, setIndexDomain] = useAtom(indexDomainAtom);
  const [priceDomain, setPriceDomain] = useAtom(priceDomainAtom);
  const zoomX = useSetAtom(zoomXAtom);
  const setIsDragging = useSetAtom(isDraggingAtom);
  const setCrosshairPosition = useSetAtom(crosshairPositionAtom);
  const setIsCrosshairActive = useSetAtom(isCrosshairActiveAtom);

  // Ref-sync pattern (동일: useChartPanZoom)
  const indexDomainRef = useRef(indexDomain);
  const priceDomainRef = useRef(priceDomain);
  const rangeRef = useRef(range);

  useEffect(() => {
    indexDomainRef.current = indexDomain;
    priceDomainRef.current = priceDomain;
    rangeRef.current = range;
  }, [indexDomain, priceDomain, range]);

  // 제스처 상태
  const gestureStateRef = useRef<GestureState>('idle');
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const lastTouchPosRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const clearLingerTimer = useCallback(() => {
    if (lingerTimerRef.current) {
      clearTimeout(lingerTimerRef.current);
      lingerTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer();
      clearLingerTimer();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [clearLongPressTimer, clearLingerTimer]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // preventDefault 불필요: touchAction: 'none' CSS가 브라우저 기본 동작 방지
      clearLingerTimer();

      const touchCount = e.touches.length;

      // 2손가락: 핀치 시작 (진행 중 제스처 전환 포함)
      if (touchCount === 2) {
        clearLongPressTimer();
        if (gestureStateRef.current === 'panning') {
          setIsDragging(false);
        }
        gestureStateRef.current = 'pinching';
        setIsDragging(true);

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        pinchStartDistRef.current = getDistance(t1, t2);
        return;
      }

      // 1손가락: PENDING 상태로 전환
      if (touchCount === 1) {
        const touch = e.touches[0];
        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
        lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
        gestureStateRef.current = 'pending';

        // 롱프레스 타이머 (500ms)
        longPressTimerRef.current = setTimeout(() => {
          if (gestureStateRef.current === 'pending') {
            gestureStateRef.current = 'crosshair';
            setIsCrosshairActive(true);

            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setCrosshairPosition({
                x: touchStartPosRef.current.x - rect.left,
                y: touchStartPosRef.current.y - rect.top,
                source: 'touch',
              });
            }

            if (navigator.vibrate) navigator.vibrate(50);
          }
        }, LONG_PRESS_DELAY);
      }
    },
    [
      containerRef,
      clearLongPressTimer,
      clearLingerTimer,
      setIsDragging,
      setIsCrosshairActive,
      setCrosshairPosition,
    ],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // preventDefault 불필요: touchAction: 'none' CSS가 브라우저 기본 동작 방지

      const state = gestureStateRef.current;

      // PENDING → 이동 감지 시 PANNING 전환
      if (state === 'pending' && e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;

        if (Math.sqrt(dx * dx + dy * dy) > PAN_THRESHOLD) {
          clearLongPressTimer();
          gestureStateRef.current = 'panning';
          setIsDragging(true);
        }
        return;
      }

      // PANNING: 차트 패닝 (useChartPanZoom 동일 수학)
      if (state === 'panning' && e.touches.length >= 1) {
        if (rafIdRef.current !== null) return;

        const touch = e.touches[0];
        const clientX = touch.clientX;
        const clientY = touch.clientY;

        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;

          const deltaX = clientX - lastTouchPosRef.current.x;
          const deltaY = clientY - lastTouchPosRef.current.y;

          const currentIndexDomain = indexDomainRef.current;
          const currentPriceDomain = priceDomainRef.current;
          const currentRange = rangeRef.current;

          // X축 패닝
          if (Math.abs(deltaX) > 1) {
            const indexRange = currentIndexDomain.endIndex - currentIndexDomain.startIndex;
            const indexPerPixel = indexRange / currentRange.width;
            const indexDelta = -deltaX * indexPerPixel;

            const newStart = Math.round(currentIndexDomain.startIndex + indexDelta);
            const newEnd = Math.round(currentIndexDomain.endIndex + indexDelta);

            if (newStart >= 0) {
              setIndexDomain({ startIndex: newStart, endIndex: newEnd });
            }
          }

          // Y축 패닝
          if (Math.abs(deltaY) > 1) {
            const priceRange = currentPriceDomain.maxPrice - currentPriceDomain.minPrice;
            const pricePerPixel = priceRange / currentRange.height;
            const priceDelta = deltaY * pricePerPixel;

            const newMin = currentPriceDomain.minPrice + priceDelta;
            if (newMin >= 0) {
              setPriceDomain({
                minPrice: newMin,
                maxPrice: currentPriceDomain.maxPrice + priceDelta,
              });
            }
          }

          lastTouchPosRef.current = { x: clientX, y: clientY };
        });
        return;
      }

      // CROSSHAIR: 손가락 따라 크로스헤어 이동
      if (state === 'crosshair' && e.touches.length >= 1) {
        const touch = e.touches[0];
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setCrosshairPosition({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
            source: 'touch',
          });
        }
        return;
      }

      // PINCHING: 핀치 줌
      if (state === 'pinching' && e.touches.length === 2) {
        if (rafIdRef.current !== null) return;

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = getDistance(t1, t2);

        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;

          const scaleFactor = pinchStartDistRef.current / currentDist;
          // > 1: 손가락 오므림 = 축소, < 1: 손가락 벌림 = 확대
          const clampedFactor = Math.max(0.8, Math.min(1.2, scaleFactor));
          zoomX(clampedFactor);

          pinchStartDistRef.current = currentDist;
        });
        return;
      }
    },
    [
      containerRef,
      clearLongPressTimer,
      setIsDragging,
      setIndexDomain,
      setPriceDomain,
      setCrosshairPosition,
      zoomX,
    ],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const state = gestureStateRef.current;

      if (state === 'pending') {
        clearLongPressTimer();
      }

      if (state === 'panning') {
        setIsDragging(false);
      }

      if (state === 'crosshair') {
        setIsCrosshairActive(false);
        // 크로스헤어를 잠시 유지 후 제거
        lingerTimerRef.current = setTimeout(() => {
          setCrosshairPosition(null);
        }, CROSSHAIR_LINGER_DELAY);
      }

      if (state === 'pinching') {
        setIsDragging(false);
      }

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      gestureStateRef.current = 'idle';
    },
    [
      clearLongPressTimer,
      setIsDragging,
      setIsCrosshairActive,
      setCrosshairPosition,
    ],
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
