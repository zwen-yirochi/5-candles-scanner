export interface CandleData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface CandlePosition {
    x: number;
    y: number;
    width: number;
    height: number;
    bodyY: number;
    bodyHeight: number;
}
