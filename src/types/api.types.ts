export interface BinanceResponse {
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    closeTime: number;
    quoteVolume: string;
    trades: number;
    buyBaseVolume: string;
    buyQuoteVolume: string;
}

export interface ChartStats {
    currentPrice: number;
    priceChange: number;
    priceChangePercent: number;
    high: number;
    low: number;
    volume: number;
    isPositive: boolean;
}
