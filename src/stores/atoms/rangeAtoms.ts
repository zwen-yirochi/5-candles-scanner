import { atom } from 'jotai';
import { ChartRange } from '../../types/range.types';

export const chartRangeAtom = atom<ChartRange>({
    width: 800,
    height: 400,
});
