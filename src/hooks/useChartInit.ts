import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { initializeChartAtom } from '../stores/atoms/actionAtoms';
import { rawDataAtom, visibleDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom, indexDomainAtom } from '../stores/atoms/domainAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { CandleData } from '../types';

export const useChartInit = (data: CandleData[], width: number, height: number) => {
  const domain = useAtomValue(chartDomainAtom);
  const range = useAtomValue(chartRangeAtom);
  const visibleData = useAtomValue(visibleDataAtom);
  const [indexDomain, setIndexDomain] = useAtom(indexDomainAtom);

  const initializeChart = useSetAtom(initializeChartAtom);
  const setRawData = useSetAtom(rawDataAtom);

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

  return { domain, range, visibleData };
};
