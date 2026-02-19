// components/HighLowLines.tsx - 최고/최저 표시 (라이트 테마)
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import { visibleDataAtom } from '../../stores/atoms/dataAtoms';
import { indexDomainAtom, priceDomainAtom } from '../../stores/atoms/domainAtoms';

export const HighLowLines: React.FC = () => {
  const { width, height } = useAtomValue(chartDimensionsAtom);
  const visibleData = useAtomValue(visibleDataAtom);
  const indexDomain = useAtomValue(indexDomainAtom);
  const priceDomain = useAtomValue(priceDomainAtom);

  const { highData, lowData } = useMemo(() => {
    if (visibleData.length === 0) return { highData: null, lowData: null };

    let highPrice = -Infinity;
    let lowPrice = Infinity;
    let highIndex = 0;
    let lowIndex = 0;

    visibleData.forEach((candle, i) => {
      if (candle.high > highPrice) {
        highPrice = candle.high;
        highIndex = i;
      }
      if (candle.low < lowPrice) {
        lowPrice = candle.low;
        lowIndex = i;
      }
    });

    return {
      highData: { price: highPrice, index: highIndex },
      lowData: { price: lowPrice, index: lowIndex },
    };
  }, [visibleData]);

  if (!highData || !lowData) return null;

  const priceToPixel = (price: number): number => {
    const range = priceDomain.maxPrice - priceDomain.minPrice;
    return height - ((price - priceDomain.minPrice) / range) * height;
  };

  const indexToPixel = (index: number): number => {
    const range = indexDomain.endIndex - indexDomain.startIndex;
    return ((index - indexDomain.startIndex) / range) * width;
  };

  const candleWidth = width / (indexDomain.endIndex - indexDomain.startIndex);
  const highY = priceToPixel(highData.price);
  const highX = indexToPixel(indexDomain.startIndex + highData.index) + candleWidth / 2;
  const lowY = priceToPixel(lowData.price);
  const lowX = indexToPixel(indexDomain.startIndex + lowData.index) + candleWidth / 2;

  const isHighOnRight = highX > width / 2;
  const isLowOnRight = lowX > width / 2;

  const lineLength = width * 0.3;

  return (
    <>
      {/* 최고가 L자 라인 */}
      <div className="absolute pointer-events-none" style={{ left: `${highX}px`, top: `${highY}px` }}>
        <div
          className="absolute h-px bg-gray-500"
          style={{
            width: `${lineLength}px`,
            top: '0',
            [isHighOnRight ? 'right' : 'left']: '0',
          }}
        />
        <div
          className="absolute px-2 py-1 font-mono text-xs text-gray-600 bg-white border border-gray-300 rounded whitespace-nowrap"
          style={{
            [isHighOnRight ? 'right' : 'left']: `${lineLength + 5}px`,
            top: '-12px',
          }}
        >
          {highData.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
      {/* 최저가 L자 라인 */}
      <div className="absolute pointer-events-none" style={{ left: `${lowX}px`, top: `${lowY}px` }}>
        <div
          className="absolute h-px bg-gray-500"
          style={{
            width: `${lineLength}px`,
            top: '0',
            [isLowOnRight ? 'right' : 'left']: '0',
          }}
        />
        <div
          className="absolute px-2 py-1 font-mono text-xs text-gray-600 bg-white border border-gray-300 rounded whitespace-nowrap"
          style={{
            [isLowOnRight ? 'right' : 'left']: `${lineLength + 5}px`,
            top: '-12px',
          }}
        >
          {lowData.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
    </>
  );
};
