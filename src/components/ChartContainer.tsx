import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { CHART_DIMENSIONS, DEFAULT_INTERVAL, DEFAULT_LIMIT, DEFAULT_SYMBOL } from '../constants/chart.constants';
import { useChartData } from '../hooks/useChartData';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { rawDataAtom } from '../stores/atoms/dataAtoms';
import { CandlestickChart } from './Chart/CandlestickChart';
import { ChartHeader } from './Chart/ChartHeader';
import { ErrorMessage, LoadingSpinner } from './common';

const ChartContainer = () => {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [interval, setInterval] = useState(DEFAULT_INTERVAL);
  const { ref, width: containerWidth, height: containerHeight } = useResizeObserver();
  const { stats, loading, error, refetch, isWebSocketConnected } = useChartData({
    symbol,
    interval,
    limit: DEFAULT_LIMIT,
  });
  const rawData = useAtomValue(rawDataAtom);

  // 축과 패딩을 고려한 실제 차트 크기 계산
  const chartDimensions = useMemo(() => {
    const padding = 32;
    const width = Math.max(0, containerWidth - padding - CHART_DIMENSIONS.AXIS_WIDTH);
    const height = Math.max(0, containerHeight - padding - CHART_DIMENSIONS.AXIS_HEIGHT);
    return { width, height };
  }, [containerWidth, containerHeight]);

  if (loading && rawData.length === 0) {
    return <LoadingSpinner message="데이터 로딩 중..." />;
  }

  if (error && rawData.length === 0) {
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

      <div ref={ref} className="w-full h-[calc(80vh-120px)] p-4">
        {rawData.length > 0 && chartDimensions.width > 0 && chartDimensions.height > 0 ? (
          <CandlestickChart width={chartDimensions.width} height={chartDimensions.height} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-800 border border-gray-700 rounded-lg">
            <p className="text-gray-500">차트 데이터를 불러오는 중...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartContainer;
