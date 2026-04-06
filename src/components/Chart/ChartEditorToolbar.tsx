// src/components/Chart/ChartEditorToolbar.tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, { useCallback } from 'react';
import {
  activeToolAtom,
  drawingObjectsAtom,
  draftObjectAtom,
  editorModeAtom,
  selectedObjectIdAtom,
} from '../../stores/atoms/editorAtoms';
import { EditorToolType, ToolDefinition } from '../../types/editor.types';

const EDITOR_TOOLS: ToolDefinition[] = [
  { type: 'hline',     label: 'HLine' },
  { type: 'trendline', label: 'Trend' },
  // 새 툴은 여기에 추가
];

export const ChartEditorToolbar: React.FC = () => {
  const [editorMode, setEditorMode]         = useAtom(editorModeAtom);
  const [activeTool, setActiveTool]         = useAtom(activeToolAtom);
  const [selectedId, setSelectedId]         = useAtom(selectedObjectIdAtom);
  const setDrawingObjects                   = useSetAtom(drawingObjectsAtom);
  const setDraftObject                      = useSetAtom(draftObjectAtom);

  const handlePan = useCallback(() => {
    setEditorMode('pan');
    setActiveTool('none');
    setDraftObject(null);
    setSelectedId(null);
  }, [setEditorMode, setActiveTool, setDraftObject, setSelectedId]);

  const handleToolSelect = useCallback((toolType: EditorToolType) => {
    if (activeTool === toolType) {
      // 같은 툴 재클릭 → Pan 복귀
      handlePan();
    } else {
      setActiveTool(toolType);
      setEditorMode('draw');
      setDraftObject(null);
      setSelectedId(null);
    }
  }, [activeTool, handlePan, setActiveTool, setEditorMode, setDraftObject, setSelectedId]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setDrawingObjects((prev) => prev.filter((obj) => obj.id !== selectedId));
    setSelectedId(null);
    setEditorMode('pan');
  }, [selectedId, setDrawingObjects, setSelectedId, setEditorMode]);

  const isPan = editorMode === 'pan' && activeTool === 'none';

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-[#F5F5F0] border-b border-[#D5D5D0]">
      {/* Pan 버튼 */}
      <button
        onClick={handlePan}
        className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium min-h-[36px] transition-colors
          ${isPan
            ? 'bg-gray-800 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
      >
        <span>↕</span>
        <span>Pan</span>
      </button>

      {/* 드로잉 툴 버튼 */}
      {EDITOR_TOOLS.map((tool) => {
        const isActive = activeTool === tool.type;
        return (
          <button
            key={tool.type}
            onClick={() => handleToolSelect(tool.type)}
            className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium min-h-[36px] transition-colors
              ${isActive
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            <span>{tool.type === 'hline' ? '—' : '╱'}</span>
            <span>{tool.label}</span>
          </button>
        );
      })}

      {/* 선택된 객체가 있을 때만 Delete 버튼 노출 */}
      {selectedId && (
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 px-3 py-2 rounded text-xs font-medium min-h-[36px] bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors ml-2"
        >
          <span>🗑</span>
          <span>Delete</span>
        </button>
      )}
    </div>
  );
};
