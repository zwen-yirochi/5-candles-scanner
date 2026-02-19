import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { initializeChartAtom } from '../stores/atoms/actionAtoms';
import { chartDimensionsAtom } from '../stores/atoms/chartConfigAtoms';
import { rawDataAtom, visibleDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom, indexDomainAtom } from '../stores/atoms/domainAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';

export const useChartInit = () => {
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const chartData = useAtomValue(rawDataAtom);
  const domain = useAtomValue(chartDomainAtom);
  const range = useAtomValue(chartRangeAtom);
  const visibleData = useAtomValue(visibleDataAtom);
  const setIndexDomain = useSetAtom(indexDomainAtom);

  const initializeChart = useSetAtom(initializeChartAtom);

  const isInitializedRef = useRef(false);
  const prevDataLengthRef = useRef(0);

  useEffect(() => {
    if (chartData.length === 0) return;

    if (!isInitializedRef.current || range.width !== width || range.height !== height) {
      initializeChart({ width, height });
      isInitializedRef.current = true;
      prevDataLengthRef.current = chartData.length;
    } else if (chartData.length !== prevDataLengthRef.current) {
      const isNewCandle = chartData.length > prevDataLengthRef.current;

      if (isNewCandle) {
        const indexShift = chartData.length - prevDataLengthRef.current;
        setIndexDomain((prev) => ({
          startIndex: prev.startIndex + indexShift,
          endIndex: prev.endIndex + indexShift,
        }));
      }
      prevDataLengthRef.current = chartData.length;
    }
  }, [chartData.length, width, height, initializeChart, setIndexDomain, range.width, range.height]);

  return { domain, range, visibleData };
};
