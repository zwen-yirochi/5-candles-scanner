import React, { useRef, useState } from 'react';
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
    const [showInfo, setShowInfo] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isRising = data.close > data.open;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation(); // 드래그 이벤트 방지

        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });

        timerRef.current = setTimeout(() => {
            setShowInfo(true);
        }, 500);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleMouseLeave = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleClickOutside = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowInfo(false);
    };

    return (
        <>
            <div
                className="absolute z-30 cursor-pointer"
                style={{ left: x, top: highY, width: candleWidth, height: wickHeight }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                {/* 심지 */}
                <div
                    className={`absolute ${isRising ? 'bg-green-500' : 'bg-red-500'}`}
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

            {/* 툴팁 - 별도 div로 분리 */}
            {showInfo && (
                <>
                    {/* 배경 클릭 시 닫기 */}
                    <div className="fixed inset-0 z-40" onClick={handleClickOutside} />

                    <div
                        className="absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 border border-gray-600 rounded shadow-lg whitespace-nowrap"
                        style={{
                            left: x > 400 ? 'auto' : `${x + candleWidth + 5}px`,
                            right: x > 400 ? `calc(100% - ${x}px + 5px)` : 'auto',
                            top: `${highY + tooltipPos.y}px`,
                            transform: 'translateY(-50%)',
                        }}
                    >
                        <div className="space-y-1">
                            <div className="text-gray-400">{new Date(data.timestamp).toLocaleString('ko-KR')}</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <div>
                                    시가: <span className="text-blue-400">${data.open.toFixed(2)}</span>
                                </div>
                                <div>
                                    고가: <span className="text-green-400">${data.high.toFixed(2)}</span>
                                </div>
                                <div>
                                    저가: <span className="text-red-400">${data.low.toFixed(2)}</span>
                                </div>
                                <div>
                                    종가: <span className="text-yellow-400">${data.close.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="pt-1 border-t border-gray-700">거래량: {data.volume.toLocaleString()}</div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Candlestick;
