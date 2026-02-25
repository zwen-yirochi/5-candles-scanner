import React from 'react';
import { CandlestickChart } from '../components/Chart/CandlestickChart';
import { ChartHeader } from '../components/Chart/ChartHeader';
import { ChartErrorBoundary } from '../components/common';
import { useResizeObserver } from '../hooks/useResizeObserver';

const DashboardContent: React.FC = () => {
  const ref = useResizeObserver();

  return (
    <div className="flex flex-col h-screen overflow-hidden mx-auto bg-[#F5F5F0]">
      <ChartHeader />
      <div ref={ref} className="flex-1 min-h-0 w-full">
        <CandlestickChart />
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
