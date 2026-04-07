// src/components/Chart/ChartEditorToolbar.tsx
import { useAtom, useSetAtom } from 'jotai';
import React, { useCallback } from 'react';
import {
  activeToolAtom,
  drawingObjectsAtom,
  draftObjectAtom,
  editorModeAtom,
  magnetEnabledAtom,
  selectedObjectIdAtom,
} from '../../stores/atoms/editorAtoms';
import { crosshairPositionAtom } from '../../stores/atoms/interactionAtoms';
import { ActiveToolType, ToolDefinition } from '../../types/editor.types';

const EDITOR_TOOLS: ToolDefinition[] = [
  { type: 'hline',     label: 'HLine' },
  { type: 'trendline', label: 'Trend' },
];

export const ChartEditorToolbar: React.FC = () => {
  const [activeTool, setActiveTool]         = useAtom(activeToolAtom);
  const [selectedId, setSelectedId]         = useAtom(selectedObjectIdAtom);
  const [magnetEnabled, setMagnetEnabled]   = useAtom(magnetEnabledAtom);
  const setEditorMode                       = useSetAtom(editorModeAtom);
  const setDraftObject                      = useSetAtom(draftObjectAtom);
  const setDrawingObjects                   = useSetAtom(drawingObjectsAtom);
  const setCrosshairPosition                = useSetAtom(crosshairPositionAtom);

  const handlePan = useCallback(() => {
    setEditorMode('pan');
    setActiveTool('none');
    setDraftObject(null);
    setSelectedId(null);
  }, [setEditorMode, setActiveTool, setDraftObject, setSelectedId]);

  const handleToolSelect = useCallback((toolType: ActiveToolType) => {
    if (activeTool === toolType) {
      handlePan();
    } else {
      setActiveTool(toolType);
      setEditorMode('draw');
      setDraftObject(null);
      setSelectedId(null);
      setCrosshairPosition(null);
    }
  }, [activeTool, handlePan, setActiveTool, setEditorMode, setDraftObject, setSelectedId, setCrosshairPosition]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setDrawingObjects((prev) => prev.filter((obj) => obj.id !== selectedId));
    setSelectedId(null);
    setEditorMode('pan');
  }, [selectedId, setDrawingObjects, setSelectedId, setEditorMode]);

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-[#F5F5F0] border-b border-[#D5D5D0]">
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

      {/* 마그넷 토글 버튼 */}
      <button
        onClick={() => setMagnetEnabled((v) => !v)}
        className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium min-h-[36px] transition-colors
          ${magnetEnabled
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        title="마그넷: OHLC 스냅"
      >
        <span>🧲</span>
        <span>Magnet</span>
      </button>

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
