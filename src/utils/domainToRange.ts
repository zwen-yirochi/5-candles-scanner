import { CandleData } from '../types/candle.types';
import { ChartDomain, IndexDomain, PriceDomain } from '../types/domain.types';
import { ChartRange } from '../types/range.types';

export const indexToPixel = (index: number, domain: IndexDomain, range: ChartRange): number => {
    const normalized = (index - domain.startIndex) / (domain.endIndex - domain.startIndex);
    return normalized * range.width;
};

export const priceToPixel = (price: number, domain: PriceDomain, range: ChartRange): number => {
    const normalized = (price - domain.minPrice) / (domain.maxPrice - domain.minPrice);
    return range.height - normalized * range.height;
};

export const candleToPixels = (candle: CandleData, index: number, domain: ChartDomain, range: ChartRange) => {
    const x = indexToPixel(index, domain.index, range);
    const candleWidth = range.width / (domain.index.endIndex - domain.index.startIndex);

    const highY = priceToPixel(candle.high, domain.price, range);
    const lowY = priceToPixel(candle.low, domain.price, range);
    const openY = priceToPixel(candle.open, domain.price, range);
    const closeY = priceToPixel(candle.close, domain.price, range);

    return {
        x,
        candleWidth,
        highY,
        lowY,
        bodyY: Math.min(openY, closeY),
        bodyHeight: Math.abs(closeY - openY),
        wickHeight: lowY - highY,
    };
};
