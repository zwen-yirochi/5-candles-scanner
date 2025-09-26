// components/chart/PatternLayer.tsx
import { useAtomValue } from 'jotai';
import React from 'react';

import { visibleDataAtom } from '../../stores/atoms/dataAtoms';
import { indexDomainAtom, priceDomainAtom } from '../../stores/atoms/domainAtoms';
import { activeDisplayPatternsAtom } from '../../stores/atoms/patternAtoms';
import { TIMEFRAME_COLORS } from '../../utils/timeframeColors';

interface PatternLayerProps {
    width: number;
    height: number;
}

export const PatternLayer: React.FC<PatternLayerProps> = ({ width, height }) => {
    const patterns = useAtomValue(activeDisplayPatternsAtom);
    const visibleData = useAtomValue(visibleDataAtom);
    const indexDomain = useAtomValue(indexDomainAtom);
    const priceDomain = useAtomValue(priceDomainAtom);

    if (!patterns || patterns.length === 0 || visibleData.length === 0) return null;

    const priceToPixel = (price: number): number => {
        const range = priceDomain.maxPrice - priceDomain.minPrice;
        return height - ((price - priceDomain.minPrice) / range) * height;
    };

    const indexToPixel = (index: number): number => {
        const range = indexDomain.endIndex - indexDomain.startIndex;
        return ((index - indexDomain.startIndex) / range) * width;
    };

    const candleWidth = Math.max(2, (width / (indexDomain.endIndex - indexDomain.startIndex)) * 0.6);

    return (
        <div className="absolute inset-0 pointer-events-none">
            {patterns.map((pattern, index) => {
                try {
                    // 매핑된 인덱스 사용
                    if (
                        pattern.mappedStartIndex < indexDomain.startIndex ||
                        pattern.mappedStartIndex > indexDomain.endIndex
                    ) {
                        return null;
                    }

                    const visibleIndex = Math.floor(pattern.mappedStartIndex - indexDomain.startIndex);
                    const startCandle = visibleData[visibleIndex];

                    if (!startCandle) return null;

                    const startX = indexToPixel(pattern.mappedStartIndex);
                    const highY = priceToPixel(startCandle.high);
                    const lowY = priceToPixel(startCandle.low);

                    const isBullish = pattern.type === 'bullish';
                    const colors = TIMEFRAME_COLORS[pattern.timeframe];
                    const color = isBullish ? colors.bullish : colors.bearish;
                    const bgColor = isBullish ? colors.bg.bullish : colors.bg.bearish;

                    return (
                        <div
                            key={`pattern-${pattern.timeframe}-${index}`}
                            className="absolute"
                            style={{ left: startX - candleWidth, top: highY }}
                        >
                            {/* 수평 박스 */}
                            <div
                                className="absolute border border-dashed"
                                style={{
                                    width: width - startX + candleWidth,
                                    height: lowY - highY,
                                    backgroundColor: bgColor,
                                    borderColor: color,
                                    opacity: 0.4,
                                }}
                            />
                        </div>
                    );
                } catch (error) {
                    console.error(`패턴 ${index} 렌더링 오류:`, error);
                    return null;
                }
            })}
        </div>
    );
};
