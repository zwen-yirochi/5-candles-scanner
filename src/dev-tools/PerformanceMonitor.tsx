import React, { useEffect, useRef, useState } from 'react';

import { FPSMeter, getMemoryUsage } from './performance';

interface PerformanceStats {
  fps: number;

  memory: string;

  renderCount: number;
}

export const PerformanceMonitor: React.FC<{ enabled?: boolean }> = ({ enabled = false }) => {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,

    memory: '0 MB',

    renderCount: 0,
  });

  const fpsMeterRef = useRef<FPSMeter | null>(null);

  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;
  });

  useEffect(() => {
    if (!enabled) return;

    fpsMeterRef.current = new FPSMeter();

    fpsMeterRef.current.start();

    const interval = setInterval(() => {
      if (fpsMeterRef.current) {
        const fpsStats = fpsMeterRef.current.getStats();

        const memoryStats = getMemoryUsage();

        setStats({
          fps: parseFloat(fpsStats.avg.toFixed(1)),

          memory: memoryStats?.usedJSHeapSize || 'N/A',

          renderCount: renderCountRef.current,
        });
      }
    }, 100); // 100ms마다 업데이트

    return () => {
      clearInterval(interval);

      if (fpsMeterRef.current) {
        fpsMeterRef.current.stop();
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  const fpsColor = stats.fps >= 55 ? 'text-green-500' : stats.fps >= 30 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="fixed z-50 p-3 font-mono text-xs text-white bg-black rounded-lg shadow-lg bg-opacity-80 top-4 right-4">
      <div className="mb-1 text-gray-400">Performance Monitor</div>

      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">FPS:</span>

          <span className={`font-bold ${fpsColor}`}>{stats.fps}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Memory:</span>

          <span className="text-blue-400">{stats.memory}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Renders:</span>

          <span className="text-purple-400">{stats.renderCount}</span>
        </div>
      </div>
    </div>
  );
};
