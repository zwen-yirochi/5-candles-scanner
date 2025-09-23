import { useAtom, useAtomValue } from 'jotai';
import React from 'react';
import { useZoomDrag } from '../../hooks/useZoomDrag';
import { visibleDataAtom } from '../../stores/atoms/dataAtoms';
import { priceDomainAtom } from '../../stores/atoms/domainAtoms';

interface PriceAxisProps {
    height: number;
    width?: number;
}

export const PriceAxis: React.FC<PriceAxisProps> = ({ height, width = 80 }) => {
    const [priceDomain, setPriceDomain] = useAtom(priceDomainAtom);
    const visibleData = useAtomValue(visibleDataAtom);

    // 줌 함수 - 중심 고정
    const handleZoom = (factor: number) => {
        const center = (priceDomain.minPrice + priceDomain.maxPrice) / 2;
        const currentRange = priceDomain.maxPrice - priceDomain.minPrice;
        const newRange = currentRange * factor;

        // 최소 범위 제한
        if (newRange < 100) return;

        const minPrice = center - newRange / 2;
        const maxPrice = center + newRange / 2;

        setPriceDomain({ minPrice, maxPrice });
    };

    const { handleMouseDown } = useZoomDrag({
        onZoom: handleZoom,
        sensitivity: 0.01,
        direction: 'vertical', // 위아래 드래그
    });

    // 자동 맞춤
    const autoFit = () => {
        if (visibleData.length === 0) return;
        const prices = visibleData.flatMap((d) => [d.high, d.low]);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const padding = (max - min) * 0.1;
        setPriceDomain({
            minPrice: min - padding,
            maxPrice: max + padding,
        });
    };

    // Y축 라벨 생성
    const labels = [];
    const labelCount = 5;
    for (let i = 0; i <= labelCount; i++) {
        const price = priceDomain.minPrice + (priceDomain.maxPrice - priceDomain.minPrice) * (1 - i / labelCount);
        labels.push(price);
    }

    const centerPrice = (priceDomain.minPrice + priceDomain.maxPrice) / 2;

    return (
        <div
            className={`relative  border-r-2 border-gray-300 
                cursor-ns-resize select-none transition-colors bg-gray-100`}
            style={{ width, height }}
            onMouseDown={handleMouseDown}
        >
            {/* 가격 라벨 */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 pr-12">
                {labels.map((price, i) => (
                    <div
                        key={i}
                        className={`text-xs font-mono text-right ${
                            Math.abs(price - centerPrice) < (priceDomain.maxPrice - priceDomain.minPrice) * 0.05
                                ? 'text-red-600 font-bold'
                                : 'text-gray-700'
                        }`}
                    >
                        ${price.toFixed(0)}
                    </div>
                ))}
            </div>

            {/* 자동 맞춤 버튼 */}
            <button
                onClick={autoFit}
                className="absolute bottom-0 px-2 py-1 text-xs text-white transition-colors transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded left-1/2 hover:bg-blue-600"
            >
                맞춤
            </button>
        </div>
    );
};
