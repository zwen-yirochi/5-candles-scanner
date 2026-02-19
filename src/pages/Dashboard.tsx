import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { CHART_DIMENSIONS } from '../constants/chart.constants';
import { useChartData } from '../hooks/useChartData';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { hasDataAtom } from '../stores/atoms/dataAtoms';
import { CandlestickChart } from '../components/Chart/CandlestickChart';
import { ChartHeader } from '../components/Chart/ChartHeader';
import { ChartErrorBoundary, LoadingSpinner } from '../components/common';

const DashboardContent: React.FC = () => {
  const { ref, width: containerWidth, height: containerHeight } = useResizeObserver();
  const { loading, error } = useChartData();
  const hasData = useAtomValue(hasDataAtom);

  const chartDimensions = useMemo(() => {
    const padding = 32;
    const width = Math.max(0, containerWidth - padding - CHART_DIMENSIONS.AXIS_WIDTH);
    const height = Math.max(0, containerHeight - padding - CHART_DIMENSIONS.AXIS_HEIGHT);
    return { width, height };
  }, [containerWidth, containerHeight]);

  if (loading && !hasData) {
    return <LoadingSpinner message="데이터 로딩 중..." />;
  }

  if (error && !hasData) {
    throw new Error(error);
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl">
        <ChartHeader />

        <div ref={ref} className="w-full h-[calc(80vh-120px)] p-4">
          {hasData && chartDimensions.width > 0 && chartDimensions.height > 0 ? (
            <CandlestickChart width={chartDimensions.width} height={chartDimensions.height} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-800 border border-gray-700 rounded-lg">
              <p className="text-gray-500">차트 데이터를 불러오는 중...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <ChartErrorBoundary>
      <DashboardContent />
    </ChartErrorBoundary>
  );
};

export default Dashboard;
