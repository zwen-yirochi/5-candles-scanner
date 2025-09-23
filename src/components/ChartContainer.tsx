import { useEffect, useMemo, useState } from 'react';
import { fetchBinance } from '../services/api/fetchBinance';
import { CandleData } from '../types';
import { CandlestickChart } from './Chart/CandlestickChart';
import { ChartHeader } from './Chart/ChartHeader';

export interface BinanceResponse {
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    closeTime: number;
    quoteVolume: string;
    trades: number;
    buyBaseVolume: string;
    buyQuoteVolume: string;
}

const ChartContainer = () => {
    const [rawResponse, setRawResponse] = useState<BinanceResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 차트 설정
    const [symbol, setSymbol] = useState('BTCUSDT');
    const [interval, setInterval] = useState('1h');
    const [limit, setLimit] = useState(100);

    // 데이터 변환
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

    // 통계 계산
    const stats = useMemo(() => {
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

    // 데이터 가져오기
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

    // 로딩 상태
    if (loading && chartData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
                <div className="w-12 h-12 mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                <p className="text-gray-400">데이터 로딩 중...</p>
            </div>
        );
    }

    // 에러 상태
    if (error && chartData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
                <div className="p-4 mb-4 text-red-400 bg-red-900 border border-red-700 rounded-lg">
                    <p className="font-bold">오류 발생</p>
                    <p>{error}</p>
                </div>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {/* 헤더 */}
            {stats && (
                <ChartHeader
                    symbol={symbol}
                    interval={interval}
                    onSymbolChange={setSymbol}
                    onIntervalChange={setInterval}
                    currentPrice={stats.currentPrice}
                    priceChange={stats.priceChange}
                    priceChangePercent={stats.priceChangePercent}
                    high24h={stats.high}
                    low24h={stats.low}
                    volume24h={stats.volume}
                />
            )}

            {/* 차트 */}
            <div className="p-4">
                {chartData.length > 0 ? (
                    <CandlestickChart data={chartData} width={1120} height={600} />
                ) : (
                    <div className="flex items-center justify-center bg-gray-800 border border-gray-700 rounded-lg h-96">
                        <p className="text-gray-500">차트 데이터를 불러오는 중...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartContainer;
