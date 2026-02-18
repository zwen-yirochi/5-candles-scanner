import { useAtom, useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { AXIS, CHART_DIMENSIONS } from '../../constants/chart.constants';
import { useZoomDrag } from '../../hooks/useZoomDrag';
import { prevPriceAtom, visibleDataAtom } from '../../stores/atoms/dataAtoms';
import { priceDomainAtom } from '../../stores/atoms/domainAtoms';
import { formatPrice, getVisiblePriceLabels } from '../../utils/priceLabel';

export interface PriceAxisProps {
  height: number;
  width?: number;
  currentPrice?: number;
}

export const PriceAxis: React.FC<PriceAxisProps> = ({ height, width = CHART_DIMENSIONS.AXIS_WIDTH, currentPrice }) => {
  const [priceDomain, setPriceDomain] = useAtom(priceDomainAtom);
  const visibleData = useAtomValue(visibleDataAtom);
  const prevPrice = useAtomValue(prevPriceAtom);
  // Get visible price labels
  const { labels: visibleLabels, step } = useMemo(() => {
    return getVisiblePriceLabels(priceDomain.minPrice, priceDomain.maxPrice, 10);
  }, [priceDomain]);

  // Calculate label positions
  const labelData = useMemo(() => {
    const priceRange = priceDomain.maxPrice - priceDomain.minPrice;
    return visibleLabels.map((price) => ({
      price,

      y: height - ((price - priceDomain.minPrice) / priceRange) * height,

      label: formatPrice(price, step),
    }));
  }, [visibleLabels, priceDomain, height, step]);

  const currentPriceData = useMemo(() => {
    if (!currentPrice) return null;
    const priceRange = priceDomain.maxPrice - priceDomain.minPrice;
    const y = height - ((currentPrice - priceDomain.minPrice) / priceRange) * height;

    const isRising = currentPrice >= (prevPrice ?? currentPrice);
    return {
      price: currentPrice,
      y,
      isRising,
      label: formatPrice(currentPrice, step),
    };
  }, [currentPrice, prevPrice, priceDomain, height, step]);

  const handleZoom = (factor: number) => {
    const center = (priceDomain.minPrice + priceDomain.maxPrice) / 2;
    const currentRange = priceDomain.maxPrice - priceDomain.minPrice;
    const newRange = currentRange * factor;
    if (newRange < AXIS.PRICE.MIN_RANGE) return;
    setPriceDomain({
      minPrice: center - newRange / 2,
      maxPrice: center + newRange / 2,
    });
  };

  const { isDragging, handleMouseDown } = useZoomDrag({
    onZoom: handleZoom,
    sensitivity: AXIS.PRICE.ZOOM_SENSITIVITY,
    direction: 'vertical',
  });

  const autoFit = () => {
    if (visibleData.length === 0) return;
    const prices = visibleData.flatMap((d) => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.15;

    setPriceDomain({
      minPrice: min - padding,
      maxPrice: max + padding,
    });
  };

  return (
    <div className="relative">
      <div
        className={`relative bg-gradient-to-r from-gray-800 to-gray-900 border-l-2 border-gray-600
                cursor-ns-resize select-none transition-colors ${
                  isDragging ? 'bg-blue-900' : 'hover:from-gray-700 hover:to-gray-800'
                }`}
        style={{ width, height }}
        onMouseDown={handleMouseDown}
      >
        {currentPriceData && (
          <div
            className="absolute left-0 z-10 flex items-center "
            style={{ top: `${currentPriceData.y}px`, transform: 'translateY(-50%)' }}
          >
            {/* Highlighted indicator line */}
            <div className={`w-2 h-px ${currentPriceData.isRising ? 'bg-green-500' : 'bg-red-500'}`} />

            {/* Current Price */}
            <div
              className={`px-2 py-1 text-xs font-mono font-bold text-white rounded ${
                currentPriceData.isRising ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              ${currentPriceData.label}
            </div>
          </div>
        )}
        {/* Drag Indicator */}
        <div className="absolute inset-y-0 flex flex-col items-center justify-center gap-1 left-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-gray-500 rounded-full" />
          ))}
          {/* Current Price Label */}
        </div>

        {/* Price Labels */}
        <div className="absolute inset-0 pl-6">
          {labelData.map((item) => (
            <div
              key={item.price}
              className="absolute left-0 flex items-center gap-2"
              style={{ top: `${item.y}px`, transform: 'translateY(-50%)' }}
            >
              {/* Grid Connection Line */}
              <div className="w-2 h-px bg-gray-500" />
              {/* Price */}
              <div className="px-2 py-0.5 text-xs font-mono text-gray-200 ">${item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto Fit Button - Below the axis */}
      <button
        onClick={autoFit}
        className="absolute w-full p-1 text-xs text-white transform -translate-x-1/2 bg-blue-600 rounded-b left-1/2 hover:bg-blue-700"
        style={{ top: height }}
      >
        Auto Fit
      </button>
    </div>
  );
};
