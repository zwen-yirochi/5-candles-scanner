import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
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

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const isInitializedRef = useRef(false);
  const prevDataLengthRef = useRef(0);

  useEffect(() => {
    if (data.length === 0) return;
    // 초기화되지 않았거나 크기가 변경된 경우에만 초기화
    if (!isInitializedRef.current || range.width !== width || range.height !== height) {
      initializeChart({ data, width, height });
      isInitializedRef.current = true;
      prevDataLengthRef.current = data.length;
    } else {
      // 이미 초기화된 경우 데이터만 업데이트
      const dataLengthChanged = data.length !== prevDataLengthRef.current;
      const isNewCandle = dataLengthChanged && data.length > prevDataLengthRef.current;
      setRawData(data);
      // 새로운 캔들이 추가된 경우, 인덱스 도메인 조정
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

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  // 드래그 중 - X/Y 동시 처리
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // X축 패닝 (시간)
      if (Math.abs(deltaX) > 1) {
        const indexRange = indexDomain.endIndex - indexDomain.startIndex;
        const indexPerPixel = indexRange / width;
        const indexDelta = -deltaX * indexPerPixel;

        const newStart = indexDomain.startIndex + indexDelta;
        const newEnd = indexDomain.endIndex + indexDelta;

        if (newStart >= 0) {
          setIndexDomain({
            startIndex: newStart,
            endIndex: newEnd,
          });
        }
      }

      // Y축 패닝 (가격)
      if (Math.abs(deltaY) > 1) {
        const priceRange = priceDomain.maxPrice - priceDomain.minPrice;
        const pricePerPixel = priceRange / height;
        const priceDelta = deltaY * pricePerPixel; // Y는 위가 작은 값

        setPriceDomain({
          minPrice: priceDomain.minPrice + priceDelta,
          maxPrice: priceDomain.maxPrice + priceDelta,
        });
      }

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, indexDomain, priceDomain, width, height, setIndexDomain, setPriceDomain],
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
      if (!e.defaultPrevented && e.cancelable) {
        e.preventDefault();
      }
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      zoomX(factor);
      setTimeout(() => autoFitY(), 0);
    },
    [zoomX, autoFitY],
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
