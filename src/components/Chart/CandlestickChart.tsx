import React, { useEffect } from 'react';
import { useChart } from '../../hooks/useChart';
import { usePatternAnalysis } from '../../hooks/usePatternAnalysis';
import { CandleData } from '../../types/candle.types';
import { candleToPixels } from '../../utils/domainToRange';
import Candlestick from './Candlestick';
import { Crosshair } from './Crosshair';
import { HighLowLines } from './HighLowLines';
import { PatternLayer } from './PatternLayer';
import { PriceAxis } from './PriceAxis';
import { TimeAxis } from './TimeAxis';

interface Props {
    data: CandleData[];
    width?: number;
    height?: number;
}

export const CandlestickChart: React.FC<Props> = ({ data, width = 800, height = 400 }) => {
    const chart = useChart(data, width, height);
    const { timeframeData, patterns, loading, error } = usePatternAnalysis('BTCUSDT');

    useEffect(() => {
        if (!loading && !error) {
            console.log('=== 현재 로드된 데이터 개수 ===');
            Object.entries(timeframeData).forEach(([timeframe, data]) => {
                console.log(`${timeframe}: ${data.length}개 캔들`);
            });

            console.log('=== 검출된 패턴 총계 ===');
            let totalPatterns = 0;
            Object.entries(patterns).forEach(([timeframe, patternList]) => {
                console.log(`${timeframe}: ${patternList.length}개 패턴`);
                totalPatterns += patternList.length;
            });
            console.log(`전체 패턴 수: ${totalPatterns}개`);
        }
    }, [timeframeData, patterns, loading, error]);
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
                {/* <PatternControlPanel /> */}
                <div className="flex">
                    {/* 메인 차트 */}
                    <div>
                        <div
                            className="relative overflow-hidden bg-gray-900 border-2 border-gray-300"
                            style={{ width, height }}
                            onWheel={chart.handleWheel}
                            onMouseDown={chart.handleMouseDown}
                        >
                            {/* 캔들스틱 */}
                            {chart.visibleData.map((candle, i) => {
                                const actualIndex = chart.domain.index.startIndex + i;
                                const pos = candleToPixels(candle, actualIndex, chart.domain, chart.range);

                                return <Candlestick key={actualIndex} data={candle} {...pos} />;
                            })}

                            {/* 패턴 레이어 */}
                            <PatternLayer width={width} height={height} />

                            {/* 최고/최저 라인 */}
                            <HighLowLines width={width} height={height} />

                            {/* 십자선 */}
                            <Crosshair width={width} height={height} />
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
