// src/config/editorContextActions.ts
import { ActiveToolType, DrawingObject, TrendlineObject } from '../types/editor.types';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: string;
  type: 'button' | 'toggle';
  /** toggle 타입일 때 활성 상태 판단 */
  isActive?: (obj: DrawingObject) => boolean;
  /** DrawingObject 반환 = 업데이트, null 반환 = 삭제 */
  onAction: (obj: DrawingObject) => DrawingObject | null;
}

const extendLeftAction: ContextMenuAction = {
  id: 'extendLeft',
  label: 'Extend Left',
  icon: '←',
  type: 'toggle',
  isActive: (obj) => !!(obj as TrendlineObject).extendLeft,
  onAction: (obj) => {
    const t = obj as TrendlineObject;
    return { ...t, extendLeft: !t.extendLeft };
  },
};

const extendRightAction: ContextMenuAction = {
  id: 'extendRight',
  label: 'Extend Right',
  icon: '→',
  type: 'toggle',
  isActive: (obj) => !!(obj as TrendlineObject).extendRight,
  onAction: (obj) => {
    const t = obj as TrendlineObject;
    return { ...t, extendRight: !t.extendRight };
  },
};

const deleteAction: ContextMenuAction = {
  id: 'delete',
  label: 'Delete',
  icon: '×',
  type: 'button',
  onAction: () => null,
};

export const CONTEXT_ACTIONS: Record<ActiveToolType, ContextMenuAction[]> = {
  hline:     [deleteAction],
  trendline: [extendLeftAction, extendRightAction, deleteAction],
};
