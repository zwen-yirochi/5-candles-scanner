import React from 'react';
import { CANDLESTICK, CHART_COLORS } from '../../constants/chart.constants';
import { CandleData } from '../../types';

export interface CandlestickProps {
    data: CandleData;
    x: number;
    candleWidth: number;
    highY: number;
    lowY: number;
    bodyY: number;
    bodyHeight: number;
    wickHeight: number;
}

export const Candlestick: React.FC<CandlestickProps> = ({
    data,
    x,
    candleWidth,
    highY,
    bodyY,
    bodyHeight,
    wickHeight,
}) => {
    const isRising = data.close > data.open;
    const colors = isRising ? CHART_COLORS.RISING : CHART_COLORS.FALLING;

    return (
        <div className="absolute" style={{ left: x, top: highY, width: candleWidth, height: wickHeight }}>
            {/* Wick */}
            <div
                className={`absolute ${colors.body}`}
                style={{
                    left: `${candleWidth / 2 - CANDLESTICK.WICK_WIDTH / 2}px`,
                    width: `${CANDLESTICK.WICK_WIDTH}px`,
                    height: '100%',
                }}
            />

            {/* Body */}
            <div
                className={`absolute border ${colors.body} ${colors.border}`}
                style={{
                    left: `${candleWidth * CANDLESTICK.BODY_OFFSET_RATIO}px`,
                    top: `${bodyY - highY}px`,
                    width: `${candleWidth * CANDLESTICK.BODY_WIDTH_RATIO}px`,
                    height: `${Math.max(bodyHeight, CANDLESTICK.MIN_BODY_HEIGHT)}px`,
                }}
            />
        </div>
    );
};
