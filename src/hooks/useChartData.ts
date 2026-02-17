import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetch24hrStats, fetchBinance } from '../services/api/fetchBinance';
import { updateCandleAtom } from '../stores/atoms/actionAtoms';
import { currentPriceAtom, rawDataAtom } from '../stores/atoms/dataAtoms';
import { Binance24hrStats, CandleData, ChartStats } from '../types';

import { useBinanceWebSocket } from './useBinanceWebSocket';

interface UseChartDataParams {
  symbol: string;
  interval: string;
  limit: number;
  enableWebSocket?: boolean;
}

interface UseChartDataReturn {
  stats: ChartStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isWebSocketConnected: boolean;
}

export const useChartData = ({
  symbol,
  interval,
  limit,
  enableWebSocket = true,
}: UseChartDataParams): UseChartDataReturn => {
  const setRawData = useSetAtom(rawDataAtom);
  const updateCandle = useSetAtom(updateCandleAtom);
  const currentPrice = useAtomValue(currentPriceAtom);

  const [stats24hr, setStats24hr] = useState<Binance24hrStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 웹소켓으로 실시간 데이터 수신
  const { latestCandle, isConnected: isWebSocketConnected } = useBinanceWebSocket({
    symbol,
    interval,
    enabled: enableWebSocket,
  });

  // WebSocket 캔들 수신 시 atom에 직접 병합
  useEffect(() => {
    if (latestCandle) updateCandle(latestCandle);
  }, [latestCandle, updateCandle]);

  // Calculate statistics — currentPriceAtom은 close 값이 변할 때만 갱신
  const stats: ChartStats | null = useMemo(() => {
    if (currentPrice === null || !stats24hr) return null;
    const priceChange = parseFloat(stats24hr.priceChange);
    const priceChangePercent = parseFloat(stats24hr.priceChangePercent);

    return {
      currentPrice,
      priceChange,
      priceChangePercent,
      high: parseFloat(stats24hr.highPrice),
      low: parseFloat(stats24hr.lowPrice),
      volume: parseFloat(stats24hr.volume),
      isPositive: priceChange >= 0,
    };
  }, [currentPrice, stats24hr]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [klineResult, stats24hrResult] = await Promise.all([
        fetchBinance(symbol, interval, limit),
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
  }, [interval, limit, symbol, setRawData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    loading,
    error,
    refetch: fetchData,
    isWebSocketConnected,
  };
};
