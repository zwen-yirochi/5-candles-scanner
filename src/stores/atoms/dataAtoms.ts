import { atom } from 'jotai';
import { IndexDomain } from '../../types';
import { CandleData } from '../../types/candle.types';
import { indexDomainAtom } from './domainAtoms';

export const rawDataAtom = atom<CandleData[]>([]);

export const visibleDataAtom = atom((get) => {
    const data = get(rawDataAtom);
    const { startIndex, endIndex }: IndexDomain = get(indexDomainAtom);

    if (data.length === 0) return [];

    const safeStart = Math.max(0, Math.floor(startIndex));
    const safeEnd = Math.min(data.length - 1, Math.floor(endIndex));

    if (safeStart > safeEnd) return [];

    return data.slice(safeStart, safeEnd + 1);
});
