import { useSetAtom } from 'jotai';
import { useLayoutEffect, useRef } from 'react';
import { containerSizeAtom } from '../stores/atoms/chartConfigAtoms';

export const useResizeObserver = () => {
  const ref = useRef<HTMLDivElement>(null);
  const setContainerSize = useSetAtom(containerSizeAtom);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const observeTarget = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(observeTarget);

    return () => resizeObserver.disconnect();
  }, [setContainerSize]);

  return ref;
};
