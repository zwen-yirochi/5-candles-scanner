import { useEffect, useRef } from 'react';

import { FPSMeter, getMemoryUsage } from './performance';

interface PerformanceMetrics {
  fps: { avg: number; min: number; max: number };

  memory: ReturnType<typeof getMemoryUsage>;

  renderCount: number;
}

export const usePerformanceMonitor = (componentName: string, enabled = false) => {
  const renderCountRef = useRef(0);

  const fpsMeterRef = useRef<FPSMeter | null>(null);

  useEffect(() => {
    renderCountRef.current++;

    if (enabled) {
      console.log(`[${componentName}] Render #${renderCountRef.current}`);
    }
  });

  useEffect(() => {
    if (!enabled) return;

    fpsMeterRef.current = new FPSMeter();

    fpsMeterRef.current.start();

    const interval = setInterval(() => {
      if (fpsMeterRef.current) {
        const fpsStats = fpsMeterRef.current.getStats();

        const memoryStats = getMemoryUsage();

        const metrics: PerformanceMetrics = {
          fps: fpsStats,

          memory: memoryStats,

          renderCount: renderCountRef.current,
        };

        console.log(`[Performance Monitor] ${componentName}`, {
          'FPS (avg)': fpsStats.avg.toFixed(1),

          'FPS (min-max)': `${fpsStats.min.toFixed(1)} - ${fpsStats.max.toFixed(1)}`,

          'Render Count': renderCountRef.current,

          Memory: memoryStats,
        });
      }
    }, 3000); // 3초마다 출력

    return () => {
      clearInterval(interval);

      if (fpsMeterRef.current) {
        fpsMeterRef.current.stop();
      }
    };
  }, [componentName, enabled]);

  return {
    renderCount: renderCountRef.current,

    getFPS: () => fpsMeterRef.current?.getStats(),
  };
};

// 리렌더링 원인 추적 Hook

export const useWhyDidYouUpdate = (name: string, props: Record<string, any>) => {
  const previousProps = useRef<Record<string, any> | undefined>(undefined);

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });

      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],

            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[Why Did You Update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
};
