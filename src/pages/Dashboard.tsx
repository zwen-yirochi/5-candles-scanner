import React, { useMemo } from 'react';
import { CHART_DIMENSIONS } from '../constants/chart.constants';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { CandlestickChart } from '../components/Chart/CandlestickChart';
import { ChartHeader } from '../components/Chart/ChartHeader';
import { ChartErrorBoundary } from '../components/common';

const DashboardContent: React.FC = () => {
  const { ref, width: containerWidth, height: containerHeight } = useResizeObserver();

  const chartDimensions = useMemo(() => {
    const padding = 32;
    const width = Math.max(0, containerWidth - padding - CHART_DIMENSIONS.AXIS_WIDTH);
    const height = Math.max(0, containerHeight - padding - CHART_DIMENSIONS.AXIS_HEIGHT);
    return { width, height };
  }, [containerWidth, containerHeight]);

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl">
        <ChartHeader />

        <div ref={ref} className="w-full h-[calc(80vh-120px)] p-4">
          {chartDimensions.width > 0 && chartDimensions.height > 0 && (
            <CandlestickChart width={chartDimensions.width} height={chartDimensions.height} />
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => (
  <ChartErrorBoundary>
    <DashboardContent />
  </ChartErrorBoundary>
);

export default Dashboard;
