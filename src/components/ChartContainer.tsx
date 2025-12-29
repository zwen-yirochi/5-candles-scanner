import { useState } from 'react';
import { CHART_DIMENSIONS, DEFAULT_INTERVAL, DEFAULT_LIMIT, DEFAULT_SYMBOL } from '../constants/chart.constants';
import { useChartData } from '../hooks/useChartData';
import { CandlestickChart } from './Chart/CandlestickChart';
import { ChartHeader } from './Chart/ChartHeader';
import { ErrorMessage, LoadingSpinner } from './common';

const ChartContainer = () => {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [interval, setInterval] = useState(DEFAULT_INTERVAL);

  const { chartData, stats, loading, error, refetch, isWebSocketConnected } = useChartData({
    symbol,
    interval,
    limit: DEFAULT_LIMIT,
  });

  if (loading && chartData.length === 0) {
    return <LoadingSpinner message="데이터 로딩 중..." />;
  }

  if (error && chartData.length === 0) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-black">
      {stats && (
        <ChartHeader
          symbol={symbol}
          interval={interval}
          onSymbolChange={setSymbol}
          onIntervalChange={setInterval}
          stats={stats}
          isWebSocketConnected={isWebSocketConnected}
        />
      )}

      <div className="p-4">
        {chartData.length > 0 ? (
          <CandlestickChart
            data={chartData}
            width={CHART_DIMENSIONS.DEFAULT_WIDTH}
            height={CHART_DIMENSIONS.DEFAULT_HEIGHT}
          />
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
