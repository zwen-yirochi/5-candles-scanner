// components/HighLowLines.tsx - 바이낸스 스타일 최고/최저 표시
import { useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { visibleDataAtom } from '../../stores/atoms/dataAtoms';
import { indexDomainAtom, priceDomainAtom } from '../../stores/atoms/domainAtoms';

interface HighLowLinesProps {
    width: number;
    height: number;
}

export const HighLowLines: React.FC<HighLowLinesProps> = ({ width, height }) => {
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
        return (index / range) * width;
    };

    const highY = priceToPixel(highData.price);
    const highX = indexToPixel(highData.index);
    const lowY = priceToPixel(lowData.price);
    const lowX = indexToPixel(lowData.index);

    return (
        <>
            {/* 최고가 L자 라인 */}
            <div className="absolute pointer-events-none" style={{ left: `${highX}px`, top: `${highY}px` }}>
                {/* 수평선 (우측으로) */}
                <div className="absolute h-px bg-gray-400" style={{ width: `${width - highX}px`, top: '0' }} />

                {/* 가격 라벨 */}
                <div
                    className="absolute px-2 py-1 font-mono text-xs text-white bg-gray-500 rounded whitespace-nowrap"
                    style={{ right: `-${width - highX + 5}px`, top: '-12px' }}
                >
                    {highData.price.toLocaleString()}
                </div>
            </div>

            {/* 최저가 L자 라인 */}
            <div className="absolute pointer-events-none" style={{ left: `${lowX}px`, top: `${lowY}px` }}>
                {/* 수평선 (우측으로) */}
                <div className="absolute h-px bg-gray-400" style={{ width: `${width - lowX}px`, top: '0' }} />
                {/* 가격 라벨 */}
                <div
                    className="absolute px-2 py-1 font-mono text-xs text-white bg-gray-500 rounded whitespace-nowrap"
                    style={{ right: `-${width - lowX + 5}px`, top: '-12px' }}
                >
                    {lowData.price.toLocaleString()}
                </div>
            </div>
        </>
    );
};
