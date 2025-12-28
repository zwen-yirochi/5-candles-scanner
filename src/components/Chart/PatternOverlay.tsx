// components/chart/PatternOverlay.tsx
import { useAtomValue } from 'jotai';
import React from 'react';
import { rawDataAtom } from '../../stores/atoms/dataAtoms';
import { indexDomainAtom, priceDomainAtom } from '../../stores/atoms/domainAtoms';
import {
    enabledPatternsAtom,
    patternAnalysisAtom,
    TimeFrame,
    timeframeDataAtom,
} from '../../stores/atoms/patternAtoms';
import { TIMEFRAME_COLORS } from '../../utils/timeframeColors';

interface PatternOverlayProps {
    width: number;
    height: number;
}

export const PatternOverlay: React.FC<PatternOverlayProps> = ({ width, height }) => {
    const allPatterns = useAtomValue(patternAnalysisAtom);
    const enabledPatterns = useAtomValue(enabledPatternsAtom);
    const timeframeData = useAtomValue(timeframeDataAtom);
    const indexDomain = useAtomValue(indexDomainAtom);
    const priceDomain = useAtomValue(priceDomainAtom);
    const currentChartData = useAtomValue(rawDataAtom);

    // 활성화된 타임프레임의 패턴들만 추출
    const displayPatterns: Array<{ pattern: any; timeframe: TimeFrame }> = [];

    (Object.keys(enabledPatterns) as TimeFrame[]).forEach((timeframe) => {
        if (enabledPatterns[timeframe] && allPatterns[timeframe]) {
            allPatterns[timeframe].forEach((pattern) => {
                displayPatterns.push({ pattern, timeframe });
            });
        }
    });

    if (displayPatterns.length === 0) {
        console.log('활성화된 패턴이 없어서 오버레이 미표시');
        return null;
    }

    const visibleStartIndex = Math.floor(indexDomain.startIndex);
    const visibleEndIndex = Math.floor(indexDomain.endIndex);

    const startTime = currentChartData[visibleStartIndex]?.timestamp || 0;
    const endTime = currentChartData[visibleEndIndex]?.timestamp || 0;
    const timeRange = endTime - startTime;

    const timeToX = (timestamp: number): number => {
        if (timeRange === 0) return 0;
        return ((timestamp - startTime) / timeRange) * width;
    };

    const priceToY = (price: number): number => {
        const priceRange = priceDomain.maxPrice - priceDomain.minPrice;
        return height - ((price - priceDomain.minPrice) / priceRange) * height;
    };

    return (
        <svg className="absolute inset-0 pointer-events-none" width={width} height={height} style={{ zIndex: 10 }}>
            {displayPatterns.map(({ pattern, timeframe }, index) => {
                const patternData = timeframeData[timeframe];
                if (
                    !patternData ||
                    pattern.startIndex >= patternData.length ||
                    pattern.endIndex >= patternData.length
                ) {
                    return null;
                }

                const startCandle = patternData[pattern.startIndex];
                if (!startCandle) return null;

                const startX = timeToX(startCandle.timestamp);

                const closeY = priceToY(startCandle.close);
                const openY = priceToY(startCandle.open);
                const topY = Math.min(closeY, openY);
                const bottomY = Math.max(closeY, openY);

                const isBullish = pattern.type === 'bullish';
                const colors = TIMEFRAME_COLORS[timeframe];
                const strokeColor = isBullish ? colors.bullish : colors.bearish;
                const fillColor = isBullish ? colors.bg.bullish : colors.bg.bearish;

                return (
                    <g key={`pattern-overlay-${timeframe}-${index}`}>
                        <rect
                            x={startX}
                            y={topY}
                            width={Math.max(width - startX, 20)}
                            height={Math.max(bottomY - topY, 2)} // 최소 높이 보장
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={1}
                            strokeDasharray="5,5"
                            opacity={0.7}
                        />
                    </g>
                );
            })}
        </svg>
    );
};
