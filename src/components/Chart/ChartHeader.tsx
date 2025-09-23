import React from 'react';

interface ChartHeaderProps {
    symbol: string;
    interval: string;
    onSymbolChange: (symbol: string) => void;
    onIntervalChange: (interval: string) => void;
    currentPrice: number;
    priceChange: number;
    priceChangePercent: number;
    high24h: number;
    low24h: number;
    volume24h: number;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
    symbol,
    interval,
    onSymbolChange,
    onIntervalChange,
    currentPrice,
    priceChange,
    priceChangePercent,
    high24h,
    low24h,
    volume24h,
}) => {
    const isPositive = priceChange >= 0;

    return (
        <div className="p-4 text-white bg-black">
            {/* 상단: 심볼 & 변동률 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {/* 심볼 선택 */}
                    <div className="flex items-center gap-2">
                        <select
                            value={symbol}
                            onChange={(e) => onSymbolChange(e.target.value)}
                            className="px-3 py-2 font-bold text-white bg-transparent border-none cursor-pointer text-l focus:outline-none"
                        >
                            <option value="BTCUSDT" className="text-black">
                                BTC/USDT
                            </option>
                            <option value="ETHUSDT" className="text-black">
                                ETH/USDT
                            </option>
                        </select>
                    </div>

                    {/* 변동률 */}
                    <span className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}
                        {priceChangePercent.toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* 가격 정보 */}
            <div className="flex items-start justify-between mb-6">
                {/* 좌측: 현재가 */}
                <div>
                    <div className="mb-1 text-sm text-gray-400">Last Traded Price</div>
                    <div className={`text-4xl font-bold mb-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {currentPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                    <div className="text-sm text-gray-400">
                        Mark Price{' '}
                        {currentPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                </div>

                {/* 우측: 24시간 통계 */}
                <div className="text-right">
                    <div className="flex gap-12">
                        <div>
                            <div className="mb-1 text-sm text-gray-400">24h High</div>
                            <div className="text-base font-semibold">
                                {high24h.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </div>
                        </div>
                        <div>
                            <div className="mb-1 text-sm text-gray-400">24h Low</div>
                            <div className="text-base font-semibold">
                                {low24h.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 하단: 시간 간격 선택 */}
            <div className="flex items-center gap-3">
                {['1m', '5m', '15m', '30m', '1h', '4h', '1d'].map((time) => (
                    <button
                        key={time}
                        onClick={() => onIntervalChange(time)}
                        className={`px-3 py-1 text-sm font-medium transition-colors rounded ${
                            interval === time
                                ? 'text-white bg-gray-700'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                    >
                        {time}
                    </button>
                ))}
            </div>
        </div>
    );
};
