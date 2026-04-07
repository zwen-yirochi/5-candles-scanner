// src/components/Chart/EditorContextMenu.tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, { useCallback, useEffect } from 'react';
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

  useEffect(() => {
    if (!selectedId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, close]);

  if (!selectedId || !position || !selectedObj) return null;

  const actions    = CONTEXT_ACTIONS[selectedObj.tool];
  const MENU_WIDTH = 160;
  const ITEM_H     = 28;
  const OFFSET     = 8;
  const menuHeight = actions.length * ITEM_H + 8;

  // 오른쪽 아래에 위치: 클릭 좌표 + offset, 차트 경계를 벗어나지 않도록 clamp
  const left = Math.max(4, Math.min(position.x + OFFSET, width - MENU_WIDTH - 4));
  // 수직 flip: 아래 공간이 부족하면 위에 표시
  const above = position.y + OFFSET + menuHeight > height;
  const top   = above
    ? Math.max(0, position.y - menuHeight - OFFSET)
    : position.y + OFFSET;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        zIndex:   30,
        minWidth: `${MENU_WIDTH}px`,
      }}
      className="bg-white border border-gray-300 rounded-lg shadow-sm py-1"
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
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors
              ${action.id === 'delete'
                ? 'text-neutral-400 hover:bg-gray-50'
                : isActive
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span className="text-gray-400 leading-none">{action.icon}</span>
            <span>{action.label}</span>
            {action.type === 'toggle' && (
              <span className="ml-auto text-[10px] text-gray-400">{isActive ? 'on' : ''}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
