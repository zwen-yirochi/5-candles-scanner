// src/components/Chart/EditorContextMenu.tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, { useCallback } from 'react';
import { CONTEXT_ACTIONS } from '../../config/editorContextActions';
import { chartDimensionsAtom } from '../../stores/atoms/chartConfigAtoms';
import {
  contextMenuPositionAtom,
  drawingObjectsAtom,
  editorModeAtom,
  selectedObjectIdAtom,
} from '../../stores/atoms/editorAtoms';

export const EditorContextMenu: React.FC = () => {
  const [selectedId, setSelectedId]         = useAtom(selectedObjectIdAtom);
  const [position, setPosition]             = useAtom(contextMenuPositionAtom);
  const setEditorMode                       = useSetAtom(editorModeAtom);
  const [drawingObjects, setDrawingObjects] = useAtom(drawingObjectsAtom);
  const { width, height }                   = useAtomValue(chartDimensionsAtom);

  const selectedObj = drawingObjects.find((o) => o.id === selectedId) ?? null;

  const close = useCallback(() => {
    setSelectedId(null);
    setEditorMode('pan');
    setPosition(null);
  }, [setSelectedId, setEditorMode, setPosition]);

  if (!selectedId || !position || !selectedObj) return null;

  const actions    = CONTEXT_ACTIONS[selectedObj.tool];
  const MENU_WIDTH = 160;
  const ITEM_H     = 36;
  const menuHeight = actions.length * ITEM_H + 8;

  // 수평 clamp: 메뉴가 차트 밖으로 나가지 않도록
  const clampedX = Math.max(MENU_WIDTH / 2, Math.min(position.x, width - MENU_WIDTH / 2));
  // 수직 flip: 아래 공간이 부족하면 위에 표시
  const above = position.y + menuHeight > height;
  const top   = above ? position.y - menuHeight - 8 : position.y + 8;

  return (
    <div
      style={{
        position:  'absolute',
        left:      clampedX,
        top,
        transform: 'translateX(-50%)',
        zIndex:    30,
        minWidth:  `${MENU_WIDTH}px`,
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-lg py-1"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {actions.map((action) => {
        const isActive =
          action.type === 'toggle' && action.isActive
            ? action.isActive(selectedObj)
            : false;

        return (
          <button
            key={action.id}
            onClick={() => {
              const result = action.onAction(selectedObj);
              if (result === null) {
                setDrawingObjects((prev) => prev.filter((o) => o.id !== selectedId));
                close();
              } else {
                setDrawingObjects((prev) =>
                  prev.map((o) => (o.id === selectedId ? result : o)),
                );
                if (action.type === 'button') close();
              }
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
              ${action.id === 'delete'
                ? 'text-red-600 hover:bg-red-50'
                : isActive
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <span className="text-base leading-none">{action.icon}</span>
            <span>{action.label}</span>
            {action.type === 'toggle' && (
              <span className="ml-auto text-xs text-gray-400">{isActive ? 'ON' : 'OFF'}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
