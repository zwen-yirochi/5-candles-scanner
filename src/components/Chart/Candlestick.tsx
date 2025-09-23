import React from 'react';
import { CandleData } from '../../types';

interface Props {
    data: CandleData;
    x: number;
    candleWidth: number;
    highY: number;
    lowY: number;
    bodyY: number;
    bodyHeight: number;
    wickHeight: number;
}

const Candlestick: React.FC<Props> = ({ data, x, candleWidth, highY, bodyY, bodyHeight, wickHeight }) => {
    const isRising = data.close > data.open;

    return (
        <div className="absolute" style={{ left: x, top: highY, width: candleWidth, height: wickHeight }}>
            {/* 심지 */}
            <div
                className={`absolute  ${isRising ? 'bg-green-500' : 'bg-red-500'}`}
                style={{
                    left: `${candleWidth / 2 - 0.5}px`,
                    width: '1px',
                    height: '100%',
                }}
            />

            {/* 몸통 */}
            <div
                className={`absolute border ${
                    isRising ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600'
                }`}
                style={{
                    left: `${candleWidth * 0.05}px`,
                    top: `${bodyY - highY}px`,
                    width: `${candleWidth * 0.9}px`,
                    height: `${Math.max(bodyHeight, 2)}px`,
                }}
            />
        </div>
    );
};

export default Candlestick;
