import { atom } from 'jotai';
import { CandleData } from '../../types/candle.types';
import { rawDataAtom, visibleDataAtom } from './dataAtoms';
import { indexDomainAtom, priceDomainAtom } from './domainAtoms';
import { chartRangeAtom } from './rangeAtoms';

// 초기화
export const initializeChartAtom = atom(
    null,
    (
        get,
        set,
        {
            data,
            width,
            height,
        }: {
            data: CandleData[];
            width: number;
            height: number;
        }
    ) => {
        if (data.length === 0) return;

        set(rawDataAtom, data);
        set(chartRangeAtom, { width, height });

        const displayCount = Math.min(50, data.length);
        const endIndex = data.length + 5;
        const startIndex = Math.max(0, endIndex - displayCount + 1);

        set(indexDomainAtom, { startIndex, endIndex });

        // Y축 자동 스케일
        const visibleData = data.slice(startIndex, endIndex + 1);
        const prices = visibleData.flatMap((d) => [d.open, d.high, d.low, d.close]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const padding = (maxPrice - minPrice) * 0.1;

        set(priceDomainAtom, {
            minPrice: minPrice - padding,
            maxPrice: maxPrice + padding,
        });
    }
);

// X축 줌
export const zoomXAtom = atom(null, (get, set, factor: number) => {
    const domain = get(indexDomainAtom);
    const dataLength = get(rawDataAtom).length;

    const center = (domain.startIndex + domain.endIndex) / 2;
    const currentRange = domain.endIndex - domain.startIndex;
    const newRange = currentRange * factor;

    if (newRange < 10 || newRange > dataLength) return;

    let startIndex = center - newRange / 2;
    let endIndex = center + newRange / 2;

    if (startIndex < 0) {
        startIndex = 0;
        endIndex = newRange;
    }
    if (endIndex >= dataLength) {
        endIndex = dataLength - 1;
        startIndex = dataLength - 1 - newRange;
    }

    set(indexDomainAtom, {
        startIndex: Math.max(0, startIndex),
        endIndex: Math.min(dataLength - 1, endIndex),
    });
});

// Y축 자동 맞춤
export const autoFitYAtom = atom(null, (get, set) => {
    const visibleData = get(visibleDataAtom);
    if (visibleData.length === 0) return;

    const prices = visibleData.flatMap((d) => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const padding = (maxPrice - minPrice) * 0.1;

    set(priceDomainAtom, {
        minPrice: minPrice - padding,
        maxPrice: maxPrice + padding,
    });
});

export const panXAtom = atom(null, (get, set, delta: number) => {
    const domain = get(indexDomainAtom);
    const dataLength = get(rawDataAtom).length;
    const range = domain.endIndex - domain.startIndex;

    let newStart = domain.startIndex + delta;
    let newEnd = domain.endIndex + delta;

    // 왼쪽 경계만 제한, 오른쪽은 데이터 길이를 넘어갈 수 있음
    if (newStart < 0) {
        newStart = 0;
        newEnd = range;
    }

    // 오른쪽 경계 제거 - 여백 허용
    set(indexDomainAtom, {
        startIndex: newStart,
        endIndex: newEnd,
    });
});
