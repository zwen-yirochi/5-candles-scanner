import React from 'react';
import { CHART_INTERVALS, CHART_SYMBOLS } from '../../constants/chart.constants';
import { ChartStats } from '../../types';
import { Button, Select } from '../common';

interface ChartHeaderProps {
    symbol: string;
    interval: string;
    onSymbolChange: (symbol: string) => void;
    onIntervalChange: (interval: string) => void;
    stats: ChartStats;
}

const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', {
        minimumFractionDigits: 2,

        maximumFractionDigits: 2,
    });
};

export const ChartHeader: React.FC<ChartHeaderProps> = ({
    symbol,
    interval,
    onSymbolChange,
    onIntervalChange,
    stats,
}) => {
    const { currentPrice, priceChangePercent, high, low, isPositive } = stats;
    const priceColor = isPositive ? 'text-green-500' : 'text-red-500';

    return (
        <div className="p-4 text-white bg-black">
            {/* Symbol & Change */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Select options={CHART_SYMBOLS} value={symbol} onChange={onSymbolChange} />
                    <span className={`text-lg font-semibold ${priceColor}`}>
                        {isPositive ? '+' : ''}
                        {priceChangePercent.toFixed(2)}%
                    </span>
                </div>
            </div>
            {/* Price Information */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="mb-1 text-sm text-gray-400">Last Traded Price</div>
                    <div className={`text-4xl font-bold mb-1 ${priceColor}`}>{formatPrice(currentPrice)}</div>
                    <div className="text-sm text-gray-400">Mark Price {formatPrice(currentPrice)}</div>
                </div>

                {/* 24h Statistics */}
                <div className="text-right">
                    <div className="flex gap-12">
                        <div>
                            <div className="mb-1 text-sm text-gray-400">24h High</div>
                            <div className="text-base font-semibold">{formatPrice(high)}</div>
                        </div>
                        <div>
                            <div className="mb-1 text-sm text-gray-400">24h Low</div>
                            <div className="text-base font-semibold">{formatPrice(low)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interval Selection */}
            <div className="flex items-center gap-3">
                {CHART_INTERVALS.map(({ value, label }) => (
                    <Button
                        key={value}
                        variant="ghost"
                        size="sm"
                        active={interval === value}
                        onClick={() => onIntervalChange(value)}
                    >
                        {label}
                    </Button>
                ))}
            </div>
        </div>
    );
};
