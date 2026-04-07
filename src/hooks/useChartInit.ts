import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { initializeChartAtom } from '../stores/atoms/actionAtoms';
import { chartDimensionsAtom, symbolAtom } from '../stores/atoms/chartConfigAtoms';
import { rawDataAtom, visibleDataAtom } from '../stores/atoms/dataAtoms';
import { chartDomainAtom, indexDomainAtom } from '../stores/atoms/domainAtoms';
import { chartRangeAtom } from '../stores/atoms/rangeAtoms';
import { CandleData } from '../types';

export const useChartInit = () => {
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const chartData = useAtomValue(rawDataAtom);
  const symbol = useAtomValue(symbolAtom);
  const domain = useAtomValue(chartDomainAtom);
  const range = useAtomValue(chartRangeAtom);
  const visibleData = useAtomValue(visibleDataAtom);
  const setIndexDomain = useSetAtom(indexDomainAtom);

  const initializeChart = useSetAtom(initializeChartAtom);

  const prevDataRef = useRef<CandleData[]>([]);
  const prevLengthRef = useRef(0);
  const prevSymbolRef = useRef<string>('');

  useEffect(() => {
    if (chartData.length === 0) return;

    const prevData = prevDataRef.current;
    const sizeChanged = range.width !== width || range.height !== height;

    // 심볼이 바뀌었거나 최초 로드인 경우 전체 재초기화
    // (timestamp 비교는 BTC/ETH 같은 동일 interval 심볼 간에 첫 캔들 timestamp가
    //  동일할 수 있어 신뢰할 수 없음)
    const isNewSymbol = prevData.length === 0 || symbol !== prevSymbolRef.current;

    if (isNewSymbol || sizeChanged) {
      // 전체 재초기화: 새 심볼 데이터셋 or 컨테이너 리사이즈
      initializeChart({ width, height });
      prevSymbolRef.current = symbol;
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
  }, [chartData, symbol, width, height, initializeChart, setIndexDomain, range.width, range.height]);

  return { domain, range, visibleData };
};
