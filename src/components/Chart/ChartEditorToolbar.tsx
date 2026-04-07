// src/components/Chart/ChartEditorToolbar.tsx
import { useAtom, useSetAtom } from 'jotai';
import React, { useCallback } from 'react';
import {
  activeToolAtom,
  contextMenuPositionAtom,
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
  const [activeTool, setActiveTool]       = useAtom(activeToolAtom);
  const [magnetEnabled, setMagnetEnabled] = useAtom(magnetEnabledAtom);
  const setEditorMode                     = useSetAtom(editorModeAtom);
  const setDraftObject                    = useSetAtom(draftObjectAtom);
  const setSelectedId                     = useSetAtom(selectedObjectIdAtom);
  const setCrosshairPosition              = useSetAtom(crosshairPositionAtom);
  const setContextMenuPosition            = useSetAtom(contextMenuPositionAtom);

  const handlePan = useCallback(() => {
    setEditorMode('pan');
    setActiveTool('none');
    setDraftObject(null);
    setSelectedId(null);
    setContextMenuPosition(null);
  }, [setEditorMode, setActiveTool, setDraftObject, setSelectedId, setContextMenuPosition]);

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
    </div>
  );
};
