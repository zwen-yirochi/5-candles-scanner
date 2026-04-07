import { HLineObject, TrendlineObject } from '../types/editor.types';
import { CONTEXT_ACTIONS } from './editorContextActions';

const mockHLine: HLineObject = {
  id: 'h1', tool: 'hline', selected: false, color: '#2962FF', price: 100,
};

const mockTrendline: TrendlineObject = {
  id: 't1', tool: 'trendline', selected: false, color: '#2962FF',
  p1: { index: 0, price: 100 },
  p2: { index: 5, price: 110 },
};

describe('CONTEXT_ACTIONS', () => {
  describe('hline', () => {
    it('delete 액션만 있다', () => {
      expect(CONTEXT_ACTIONS.hline).toHaveLength(1);
      expect(CONTEXT_ACTIONS.hline[0].id).toBe('delete');
    });

    it('delete onAction은 null을 반환한다', () => {
      const del = CONTEXT_ACTIONS.hline.find((a) => a.id === 'delete')!;
      expect(del.onAction(mockHLine)).toBeNull();
    });
  });

  describe('trendline', () => {
    it('extendLeft, extendRight, delete 순서로 3개 액션이 있다', () => {
      const ids = CONTEXT_ACTIONS.trendline.map((a) => a.id);
      expect(ids).toEqual(['extendLeft', 'extendRight', 'delete']);
    });

    it('extendLeft 토글: false → true', () => {
      const action = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'extendLeft')!;
      const result = action.onAction({ ...mockTrendline, extendLeft: false }) as TrendlineObject;
      expect(result.extendLeft).toBe(true);
    });

    it('extendLeft 토글: true → false', () => {
      const action = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'extendLeft')!;
      const result = action.onAction({ ...mockTrendline, extendLeft: true }) as TrendlineObject;
      expect(result.extendLeft).toBe(false);
    });

    it('extendRight 토글: false → true', () => {
      const action = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'extendRight')!;
      const result = action.onAction({ ...mockTrendline, extendRight: false }) as TrendlineObject;
      expect(result.extendRight).toBe(true);
    });

    it('extendLeft isActive: undefined/false → false, true → true', () => {
      const action = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'extendLeft')!;
      expect(action.isActive!({ ...mockTrendline })).toBe(false);
      expect(action.isActive!({ ...mockTrendline, extendLeft: false })).toBe(false);
      expect(action.isActive!({ ...mockTrendline, extendLeft: true })).toBe(true);
    });

    it('extendRight isActive: undefined → false, true → true', () => {
      const action = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'extendRight')!;
      expect(action.isActive!({ ...mockTrendline })).toBe(false);
      expect(action.isActive!({ ...mockTrendline, extendRight: true })).toBe(true);
    });

    it('delete onAction은 null을 반환한다', () => {
      const del = CONTEXT_ACTIONS.trendline.find((a) => a.id === 'delete')!;
      expect(del.onAction(mockTrendline)).toBeNull();
    });
  });
});
