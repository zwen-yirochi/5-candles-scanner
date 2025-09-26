import { useAtom, useAtomValue } from 'jotai';
import React, { useMemo } from 'react';
import { useZoomDrag } from '../../hooks/useZoomDrag';
import { visibleDataAtom } from '../../stores/atoms/dataAtoms';
import { priceDomainAtom } from '../../stores/atoms/domainAtoms';
import { formatPrice, getVisiblePriceLabels } from '../../utils/priceLabel';

interface PriceAxisProps {
    height: number;
    width?: number;
}

export const PriceAxis: React.FC<PriceAxisProps> = ({ height, width = 80 }) => {
    const [priceDomain, setPriceDomain] = useAtom(priceDomainAtom);
    const visibleData = useAtomValue(visibleDataAtom);

    // 보이는 라벨만 필터링
    const { labels: visibleLabels, step } = useMemo(() => {
        return getVisiblePriceLabels(
            priceDomain.minPrice,
            priceDomain.maxPrice,
            12 // 최대 라벨 수
        );
    }, [priceDomain]);

    // 라벨 위치 계산
    const labelData = useMemo(() => {
        const priceRange = priceDomain.maxPrice - priceDomain.minPrice;

        return visibleLabels.map((price) => ({
            price,
            y: height - ((price - priceDomain.minPrice) / priceRange) * height,
            label: formatPrice(price, step),
        }));
    }, [visibleLabels, priceDomain, height, step]);

    // 줌 함수
    const handleZoom = (factor: number) => {
        const center = (priceDomain.minPrice + priceDomain.maxPrice) / 2;
        const currentRange = priceDomain.maxPrice - priceDomain.minPrice;
        const newRange = currentRange * factor;

        if (newRange < 1) return;

        setPriceDomain({
            minPrice: center - newRange / 2,
            maxPrice: center + newRange / 2,
        });
    };

    const { isDragging, handleMouseDown } = useZoomDrag({
        onZoom: handleZoom,
        sensitivity: 0.01,
        direction: 'vertical',
    });

    // 자동 맞춤
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
                className={`relative bg-gradient-to-r from-gray-800 to-gray-900 border-r-2 border-gray-600 
                cursor-ns-resize select-none transition-colors ${
                    isDragging ? 'bg-blue-900' : 'hover:from-gray-700 hover:to-gray-800'
                }`}
                style={{ width, height }}
                onMouseDown={handleMouseDown}
            >
                {/* 드래그 인디케이터 */}
                <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center w-8 gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-gray-500 rounded-full" />
                    ))}
                </div>

                {/* 가격 라벨 */}
                <div className="absolute inset-0 pr-10">
                    {labelData.map((item, i) => (
                        <div
                            key={item.price}
                            className="absolute right-0 flex items-center gap-2"
                            style={{ top: `${item.y}px`, transform: 'translateY(-50%)' }}
                        >
                            {/* 그리드 연결선 */}
                            <div className="w-2 h-px bg-gray-500" />

                            {/* 가격 */}
                            <div className="px-2 py-0.5 text-xs font-mono text-gray-200 bg-gray-800 rounded">
                                ${item.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* 자동 맞춤 버튼 */}
            <button
                onClick={autoFit}
                className="absolute w-full p-1 text-xs text-white transform -translate-x-1/2 bg-gray-500 left-1/2 hover:bg-gray-700"
            >
                Auto Fit
            </button>
        </div>
    );
};
