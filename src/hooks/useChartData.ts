import { useEffect, useMemo, useState } from 'react';
import { fetchBinance } from '../services/api/fetchBinance';
import { BinanceResponse, CandleData, ChartStats } from '../types';

import { useBinanceWebSocket } from './useBinanceWebSocket';

interface UseChartDataParams {
  symbol: string;
  interval: string;
  limit: number;
  enableWebSocket?: boolean;
}

interface UseChartDataReturn {
  chartData: CandleData[];
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
  const [rawResponse, setRawResponse] = useState<BinanceResponse[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // 웹소켓으로 실시간 데이터 수신

  const { latestCandle, isConnected: isWebSocketConnected } = useBinanceWebSocket({
    symbol,

    interval,

    enabled: enableWebSocket,
  });
  // Transform API response to chart data
  const baseChartData: CandleData[] = useMemo(() => {
    return rawResponse.map((item) => ({
      timestamp: item.openTime,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume),
    }));
  }, [rawResponse]);

  const chartData: CandleData[] = useMemo(() => {
    if (!latestCandle || baseChartData.length === 0) {
      return baseChartData;
    }

    const lastCandle = baseChartData[baseChartData.length - 1];

    // 같은 타임스탬프면 업데이트, 다르면 새로 추가
    if (lastCandle.timestamp === latestCandle.timestamp) {
      // 마지막 캔들 업데이트
      return [
        ...baseChartData.slice(0, -1),
        {
          ...latestCandle,
          // high와 low는 기존값과 비교해서 최대/최소값 유지
          high: Math.max(lastCandle.high, latestCandle.high),
          low: Math.min(lastCandle.low, latestCandle.low),
        },
      ];
    } else {
      // 새 캔들 추가 (최대 limit 개수 유지)
      const updated = [...baseChartData, latestCandle];
      return updated.length > limit ? updated.slice(1) : updated;
    }
  }, [baseChartData, latestCandle, limit]);

  // Calculate statistics
  const stats: ChartStats | null = useMemo(() => {
    if (chartData.length === 0) return null;
    const latest = chartData[chartData.length - 1];
    const first = chartData[0];
    const priceChange = latest.close - first.open;
    const priceChangePercent = (priceChange / first.open) * 100;
    const prices = chartData.flatMap((d) => [d.high, d.low]);

    return {
      currentPrice: latest.close,
      priceChange,
      priceChangePercent,
      high: Math.max(...prices),
      low: Math.min(...prices),
      volume: chartData.reduce((sum, d) => sum + d.volume, 0),
      isPositive: priceChange >= 0,
    };
  }, [chartData]);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchBinance(symbol, interval, limit);
      setRawResponse(result);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol, interval, limit]);

  return {
    chartData,
    stats,
    loading,
    error,
    refetch: fetchData,
    isWebSocketConnected,
  };
};
