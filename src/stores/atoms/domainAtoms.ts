import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';
import { ChartDomain, IndexDomain, PriceDomain } from '../../types/domain.types';

export const indexDomainAtom = atomWithReset<IndexDomain>({
    startIndex: 0,
    endIndex: 49,
});

export const priceDomainAtom = atomWithReset<PriceDomain>({
    minPrice: 0,
    maxPrice: 100,
});

export const chartDomainAtom = atom<ChartDomain>((get) => ({
    index: get(indexDomainAtom),
    price: get(priceDomainAtom),
}));
