import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { initializeChartAtom } from '../stores/atoms/actionAtoms';
import { chartDimensionsAtom } from '../stores/atoms/chartConfigAtoms';
import { rawDataAtom, visibleDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom, indexDomainAtom } from '../stores/atoms/domainAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { CandleData } from '../types';

export const useChartInit = () => {
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const chartData = useAtomValue(rawDataAtom);
  const domain = useAtomValue(chartDomainAtom);
  const range = useAtomValue(chartRangeAtom);
  const visibleData = useAtomValue(visibleDataAtom);
  const setIndexDomain = useSetAtom(indexDomainAtom);

  const initializeChart = useSetAtom(initializeChartAtom);

  const prevDataRef = useRef<CandleData[]>([]);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (chartData.length === 0) return;

    const prevData = prevDataRef.current;
    const sizeChanged = range.width !== width || range.height !== height;

    // 데이터셋이 통째로 교체됐는지 판별: 첫 캔들 timestamp가 다르면 새 데이터
    const isDataReplaced =
      prevData.length === 0 || chartData[0]?.timestamp !== prevData[0]?.timestamp;

    if (isDataReplaced || sizeChanged) {
      // 전체 재초기화: 새 데이터셋 or 컨테이너 리사이즈
      initializeChart({ width, height });
    } else if (chartData.length > prevLengthRef.current) {
      // WebSocket: 새 캔들 추가 → index domain 시프트
      const indexShift = chartData.length - prevLengthRef.current;
      setIndexDomain((prev) => ({
        startIndex: prev.startIndex + indexShift,
        endIndex: prev.endIndex + indexShift,
      }));
    }

    prevDataRef.current = chartData;
    prevLengthRef.current = chartData.length;
  }, [chartData, width, height, initializeChart, setIndexDomain, range.width, range.height]);

  return { domain, range, visibleData };
};
