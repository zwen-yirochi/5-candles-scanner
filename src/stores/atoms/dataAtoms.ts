import { atom } from 'jotai';
import { IndexDomain } from '../../types';
import { CandleData } from '../../types/candle.types';
import { indexDomainAtom } from './domainAtoms';

export const rawDataAtom = atom<CandleData[]>([]);

export const dataLengthAtom = atom((get) => get(rawDataAtom).length);

export const currentPriceAtom = atom((get) => {
    const data = get(rawDataAtom);
    return data.length > 0 ? data[data.length - 1].close : null;
});

export const prevPriceAtom = atom((get) => {
    const data = get(rawDataAtom);
    return data.length > 1 ? data[data.length - 2].close : null;
});

export const visibleDataAtom = atom((get) => {
    const data = get(rawDataAtom);
    const { startIndex, endIndex }: IndexDomain = get(indexDomainAtom);

    if (data.length === 0) return [];

    const safeStart = Math.max(0, Math.floor(startIndex));
    const safeEnd = Math.min(data.length - 1, Math.floor(endIndex));

    if (safeStart > safeEnd) return [];

    return data.slice(safeStart, safeEnd + 1);
});
