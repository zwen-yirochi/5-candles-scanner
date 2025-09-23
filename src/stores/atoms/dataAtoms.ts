import { atom } from 'jotai';
import { IndexDomain } from '../../types';
import { CandleData } from '../../types/candle.types';
import { indexDomainAtom } from './domainAtoms';

export const rawDataAtom = atom<CandleData[]>([]);

export const visibleDataAtom = atom((get) => {
    const data = get(rawDataAtom);
    const { startIndex, endIndex }: IndexDomain = get(indexDomainAtom);

    return data.slice(Math.floor(startIndex), Math.ceil(endIndex) + 1);
});
