import React from 'react';
import { CandlestickChart } from '../components/Chart/CandlestickChart';
import { ChartHeader } from '../components/Chart/ChartHeader';
import { ChartErrorBoundary } from '../components/common';
import { useResizeObserver } from '../hooks/useResizeObserver';

const DashboardContent: React.FC = () => {
  const ref = useResizeObserver();

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl">
        <ChartHeader />

        <div ref={ref} className="w-full h-[calc(80vh-120px)] p-4">
          <CandlestickChart />
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
