/**

 * 성능 측정 유틸리티

 */

// FPS 측정기

export class FPSMeter {
  private frames: number[] = [];

  private lastTime = performance.now();

  private rafId: number | null = null;

  start() {
    const measure = () => {
      const now = performance.now();

      const delta = now - this.lastTime;

      const fps = 1000 / delta;

      this.frames.push(fps);

      if (this.frames.length > 60) {
        this.frames.shift();
      }

      this.lastTime = now;

      this.rafId = requestAnimationFrame(measure);
    };

    this.rafId = requestAnimationFrame(measure);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);

      this.rafId = null;
    }
  }

  getStats() {
    if (this.frames.length === 0) return { avg: 0, min: 0, max: 0 };

    const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;

    const min = Math.min(...this.frames);

    const max = Math.max(...this.frames);

    return { avg, min, max };
  }

  reset() {
    this.frames = [];

    this.lastTime = performance.now();
  }
}

// 렌더링 시간 측정

export const measureRender = (componentName: string, callback: () => void) => {
  const start = performance.now();

  callback();

  const end = performance.now();

  const duration = end - start;

  console.log(`[Render] ${componentName}: ${duration.toFixed(2)}ms`);

  return duration;
};

// 메모리 사용량 측정 (Chrome only)

export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;

    return {
      usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',

      totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',

      jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    };
  }

  return null;
};

// 특정 작업의 성능 측정

export const measurePerformance = async (label: string, fn: () => void | Promise<void>) => {
  const start = performance.now();

  await fn();

  const end = performance.now();

  const duration = end - start;

  console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

  return duration;
};

// React Profiler API 데이터 로깅

export const logProfilerData = (
  id: string,

  phase: 'mount' | 'update',

  actualDuration: number,

  baseDuration: number,

  startTime: number,

  commitTime: number,
) => {
  console.log(`[Profiler] ${id} (${phase})`, {
    'Actual Duration': `${actualDuration.toFixed(2)}ms`,

    'Base Duration': `${baseDuration.toFixed(2)}ms`,

    'Start Time': `${startTime.toFixed(2)}ms`,

    'Commit Time': `${commitTime.toFixed(2)}ms`,
  });
};
