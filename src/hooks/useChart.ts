import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { autoFitYAtom, initializeChartAtom, zoomXAtom } from '../stores/atoms/actionAtoms';
import { rawDataAtom, visibleDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom, indexDomainAtom, priceDomainAtom } from '../stores/atoms/domainAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { CandleData } from '../types';

export const useChart = (data: CandleData[], width: number, height: number) => {
  const domain = useAtomValue(chartDomainAtom);
  const range = useAtomValue(chartRangeAtom);
  const visibleData = useAtomValue(visibleDataAtom);

  const [indexDomain, setIndexDomain] = useAtom(indexDomainAtom);
  const [priceDomain, setPriceDomain] = useAtom(priceDomainAtom);

  const initializeChart = useSetAtom(initializeChartAtom);
  const setRawData = useSetAtom(rawDataAtom);
  const zoomX = useSetAtom(zoomXAtom);
  const autoFitY = useSetAtom(autoFitYAtom);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  const indexDomainRef = useRef(indexDomain);
  const priceDomainRef = useRef(priceDomain);
  const widthRef = useRef(width);
  const heightRef = useRef(height);

  useEffect(() => {
    indexDomainRef.current = indexDomain;
    priceDomainRef.current = priceDomain;
    widthRef.current = width;
    heightRef.current = height;
  }, [indexDomain, priceDomain, width, height]);

  const isInitializedRef = useRef(false);
  const prevDataLengthRef = useRef(0);

  useEffect(() => {
    if (data.length === 0) return;

    if (!isInitializedRef.current || range.width !== width || range.height !== height) {
      initializeChart({ data, width, height });
      isInitializedRef.current = true;
      prevDataLengthRef.current = data.length;
    } else {
      const dataLengthChanged = data.length !== prevDataLengthRef.current;
      const isNewCandle = dataLengthChanged && data.length > prevDataLengthRef.current;
      setRawData(data);

      if (isNewCandle) {
        const indexShift = data.length - prevDataLengthRef.current;
        setIndexDomain({
          startIndex: indexDomain.startIndex + indexShift,
          endIndex: indexDomain.endIndex + indexShift,
        });
      }
      prevDataLengthRef.current = data.length;
    }
  }, [data, width, height, initializeChart, setRawData, setIndexDomain, indexDomain, range.width, range.height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      if (rafIdRef.current !== null) {
        return;
      }

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;

        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;

        const currentIndexDomain = indexDomainRef.current;
        const currentPriceDomain = priceDomainRef.current;
        const currentWidth = widthRef.current;
        const currentHeight = heightRef.current;

        // X축 패닝 (시간)
        if (Math.abs(deltaX) > 1) {
          const indexRange = currentIndexDomain.endIndex - currentIndexDomain.startIndex;
          const indexPerPixel = indexRange / currentWidth;
          const indexDelta = -deltaX * indexPerPixel;

          const newStart = Math.round(currentIndexDomain.startIndex + indexDelta);
          const newEnd = Math.round(currentIndexDomain.endIndex + indexDelta);

          if (newStart >= 0) {
            setIndexDomain({
              startIndex: newStart,
              endIndex: newEnd,
            });
          }
        }

        // Y축 패닝 (가격)
        if (Math.abs(deltaY) > 1) {
          const priceRange = currentPriceDomain.maxPrice - currentPriceDomain.minPrice;
          const pricePerPixel = priceRange / currentHeight;
          const priceDelta = deltaY * pricePerPixel;

          setPriceDomain({
            minPrice: currentPriceDomain.minPrice + priceDelta,
            maxPrice: currentPriceDomain.maxPrice + priceDelta,
          });
        }

        dragStartRef.current = { x: e.clientX, y: e.clientY };
      });
    },
    [setIndexDomain, setPriceDomain],
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => handleMouseMove(e);
    const handleUp = () => handleMouseUp();

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  const lastWheelTimeRef = useRef(0);
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.defaultPrevented && e.cancelable) {
        e.preventDefault();
      }

      const now = Date.now();
      if (now - lastWheelTimeRef.current < 16) {
        return;
      }
      lastWheelTimeRef.current = now;

      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      zoomX(factor);
    },
    [zoomX],
  );

  return {
    domain,
    range,
    visibleData,
    handleWheel,
    handleMouseDown,
    isDraggingRef,
    autoFitY,
  };
};
