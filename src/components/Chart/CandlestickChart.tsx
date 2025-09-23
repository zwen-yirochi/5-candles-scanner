import React from 'react';
import { useChart } from '../../hooks/useChart';
import { CandleData } from '../../types/candle.types';
import { candleToPixels } from '../../utils/domainToRange';
import Candlestick from './Candlestick';
import { PriceAxis } from './PriceAxis';
import { TimeAxis } from './TimeAxis';

interface Props {
    data: CandleData[];
    width?: number;
    height?: number;
}

export const CandlestickChart: React.FC<Props> = ({ data, width = 800, height = 400 }) => {
    const chart = useChart(data, width, height);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center border rounded-lg h-96 bg-gray-50">
                <p className="text-gray-500">데이터 없음</p>
            </div>
        );
    }

    return (
        <div className="bg-black border-2shadow-lg">
            {/* 차트 + 축 */}
            <div className="p-4">
                <div className="flex">
                    {/* 메인 차트 */}
                    <div>
                        <div
                            className="relative overflow-hidden bg-gray-900 border-2 border-gray-300"
                            style={{ width, height }}
                            onWheel={chart.handleWheel}
                            onMouseDown={chart.handleMouseDown}
                        >
                            {/* 그리드 */}
                            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => (
                                <div
                                    key={i}
                                    className="absolute left-0 right-0 border-t border-gray-200"
                                    style={{ top: `${ratio * height}px` }}
                                />
                            ))}

                            {/* 캔들스틱 */}
                            {chart.visibleData.map((candle, i) => {
                                const actualIndex = chart.domain.index.startIndex + i;
                                const pos = candleToPixels(candle, actualIndex, chart.domain, chart.range);

                                return <Candlestick key={actualIndex} data={candle} {...pos} />;
                            })}
                        </div>

                        {/* X축 (시간) */}
                        <TimeAxis width={width} height={60} />
                    </div>
                    {/* Y축 (가격) */}
                    <PriceAxis height={height} width={80} />
                </div>
            </div>
        </div>
    );
};

export default CandlestickChart;
