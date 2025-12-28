import { useEffect, useMemo, useState } from 'react';
import { fetchBinance } from '../services/api/fetchBinance';
import { BinanceResponse, CandleData, ChartStats } from '../types';

interface UseChartDataParams {
    symbol: string;
    interval: string;
    limit: number;
}

interface UseChartDataReturn {
    chartData: CandleData[];
    stats: ChartStats | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useChartData = ({ symbol, interval, limit }: UseChartDataParams): UseChartDataReturn => {
    const [rawResponse, setRawResponse] = useState<BinanceResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Transform API response to chart data
    const chartData: CandleData[] = useMemo(() => {
        return rawResponse.map((item) => ({
            timestamp: item.openTime,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseFloat(item.volume),
        }));
    }, [rawResponse]);

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
    };
};
