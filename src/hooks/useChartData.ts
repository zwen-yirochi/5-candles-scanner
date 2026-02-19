import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LIMIT } from '../constants/chart.constants';
import { fetch24hrStats, fetchBinance } from '../services/api/fetchBinance';
import { updateCandleAtom } from '../stores/atoms/actionAtoms';
import { intervalAtom, stats24hrAtom, symbolAtom, wsConnectedAtom } from '../stores/atoms/chartConfigAtoms';
import { rawDataAtom } from '../stores/atoms/dataAtoms';
import { CandleData } from '../types';

import { useBinanceWebSocket } from './useBinanceWebSocket';

interface UseChartDataReturn {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useChartData = (): UseChartDataReturn => {
  const symbol = useAtomValue(symbolAtom);
  const interval = useAtomValue(intervalAtom);
  const setRawData = useSetAtom(rawDataAtom);
  const updateCandle = useSetAtom(updateCandleAtom);
  const setStats24hr = useSetAtom(stats24hrAtom);
  const setWsConnected = useSetAtom(wsConnectedAtom);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 웹소켓으로 실시간 데이터 수신
  const { latestCandle, isConnected } = useBinanceWebSocket({
    symbol,
    interval,
    enabled: true,
  });

  // WebSocket 연결 상태를 atom에 동기화
  useEffect(() => {
    setWsConnected(isConnected);
  }, [isConnected, setWsConnected]);

  // WebSocket 캔들 수신 시 atom에 직접 병합
  useEffect(() => {
    if (latestCandle) updateCandle(latestCandle);
  }, [latestCandle, updateCandle]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [klineResult, stats24hrResult] = await Promise.all([
        fetchBinance(symbol, interval, DEFAULT_LIMIT),
        fetch24hrStats(symbol),
      ]);
      const parsed: CandleData[] = klineResult.map((item) => ({
        timestamp: item.openTime,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume),
      }));
      setRawData(parsed);
      setStats24hr(stats24hrResult);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [interval, symbol, setRawData, setStats24hr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    refetch: fetchData,
  };
};
