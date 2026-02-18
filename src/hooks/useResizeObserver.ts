import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

export const useResizeObserver = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();

    if (width > 0 && height > 0) {
      setSize({ width, height });
    }
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const observeTarget = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    });

    resizeObserver.observe(observeTarget);

    return () => resizeObserver.disconnect();
  }, []);

  return { ref, ...size };
};
