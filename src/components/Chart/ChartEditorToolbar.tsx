// src/components/Chart/ChartEditorToolbar.tsx
import { useAtom, useSetAtom } from 'jotai';
import React, { useCallback } from 'react';
import {
  activeToolAtom,
  draftObjectAtom,
  editorModeAtom,
  selectedObjectIdAtom,
} from '../../stores/atoms/editorAtoms';
import { crosshairPositionAtom } from '../../stores/atoms/interactionAtoms';
import { ActiveToolType, ToolDefinition } from '../../types/editor.types';

const EDITOR_TOOLS: ToolDefinition[] = [
  { type: 'hline',     label: 'HLine' },
  { type: 'trendline', label: 'Trend' },
  // 새 툴은 여기에 추가
];

export const ChartEditorToolbar: React.FC = () => {
  const [activeTool, setActiveTool]         = useAtom(activeToolAtom);
  const setEditorMode                       = useSetAtom(editorModeAtom);
  const setSelectedId                       = useSetAtom(selectedObjectIdAtom);
  const setDraftObject                      = useSetAtom(draftObjectAtom);
  const setCrosshairPosition                = useSetAtom(crosshairPositionAtom);

  const handlePan = useCallback(() => {
    setEditorMode('pan');
    setActiveTool('none');
    setDraftObject(null);
    setSelectedId(null);
  }, [setEditorMode, setActiveTool, setDraftObject, setSelectedId]);

  const handleToolSelect = useCallback((toolType: ActiveToolType) => {
    if (activeTool === toolType) {
      // 같은 툴 재클릭 → Pan 복귀
      handlePan();
    } else {
      setActiveTool(toolType);
      setEditorMode('draw');
      setDraftObject(null);
      setSelectedId(null);
      setCrosshairPosition(null); // 드로잉 모드 진입 시 크로스헤어 제거
    }
  }, [activeTool, handlePan, setActiveTool, setEditorMode, setDraftObject, setSelectedId, setCrosshairPosition]);

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-[#F5F5F0] border-b border-[#D5D5D0]">
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
    </div>
  );
};
