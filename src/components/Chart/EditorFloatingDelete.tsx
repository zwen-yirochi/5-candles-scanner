// src/components/Chart/EditorFloatingDelete.tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, { useMemo } from 'react';
import { chartDomainAtom } from '../../stores/atoms/domainAtoms';
import {
  drawingObjectsAtom,
  editorModeAtom,
  selectedObjectIdAtom,
} from '../../stores/atoms/editorAtoms';
import { chartRangeAtom } from '../../stores/atoms/rangeAtoms';
import { TrendlineObject } from '../../types/editor.types';
import {
  indexToPixel,
  priceToPixel,
} from '../../utils/domainToRange';

export const EditorFloatingDelete: React.FC = () => {
  const [selectedId, setSelectedId] = useAtom(selectedObjectIdAtom);
  const setDrawingObjects            = useSetAtom(drawingObjectsAtom);
  const setEditorMode                = useSetAtom(editorModeAtom);
  const drawingObjects               = useAtomValue(drawingObjectsAtom);
  const domain                       = useAtomValue(chartDomainAtom);
  const range                        = useAtomValue(chartRangeAtom);

  const selectedObj = useMemo(
    () => drawingObjects.find((o) => o.id === selectedId) ?? null,
    [drawingObjects, selectedId],
  );

  const position = useMemo(() => {
    if (!selectedObj) return null;

    if (selectedObj.tool === 'hline') {
      const y = priceToPixel(selectedObj.price, domain.price, range);
      return { x: range.width - 20, y };
    }

    if (selectedObj.tool === 'trendline') {
      const tObj = selectedObj as TrendlineObject;
      const candleWidth = range.width / (domain.index.endIndex - domain.index.startIndex);
      const centerOffset = candleWidth * 0.5;
      const x1 = indexToPixel(tObj.p1.index, domain.index, range) + centerOffset;
      const y1 = priceToPixel(tObj.p1.price, domain.price, range);
      const x2 = indexToPixel(tObj.p2.index, domain.index, range) + centerOffset;
      const y2 = priceToPixel(tObj.p2.price, domain.price, range);
      return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    }

    return null;
  }, [selectedObj, domain, range]);

  if (!selectedId || !position) return null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDrawingObjects((prev) => prev.filter((o) => o.id !== selectedId));
    setSelectedId(null);
    setEditorMode('pan');
  };

  return (
    <button
      onClick={handleDelete}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
      }}
      className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white text-sm font-bold shadow-md hover:bg-red-600 transition-colors"
    >
      ×
    </button>
  );
};
