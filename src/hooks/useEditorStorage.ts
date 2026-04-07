// src/hooks/useEditorStorage.ts
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { symbolAtom } from '../stores/atoms/chartConfigAtoms';
import { drawingObjectsAtom } from '../stores/atoms/editorAtoms';
import { DrawingObject } from '../types/editor.types';

const STORAGE_KEY_PREFIX = 'editor_drawings_';

function loadFromStorage(symbol: string): DrawingObject[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${symbol}`);
    if (!raw) return [];
    return JSON.parse(raw) as DrawingObject[];
  } catch {
    return [];
  }
}

function saveToStorage(symbol: string, objects: DrawingObject[]): void {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${symbol}`, JSON.stringify(objects));
}

export const useEditorStorage = () => {
  const symbol = useAtomValue(symbolAtom);
  const [drawingObjects, setDrawingObjects] = useAtom(drawingObjectsAtom);

  // 심볼 변경 감지를 위한 이전값 추적
  const prevSymbolRef      = useRef<string | null>(null);
  // saveToStorage에서 항상 최신 drawingObjects를 참조하기 위한 ref
  const drawingObjectsRef  = useRef(drawingObjects);
  drawingObjectsRef.current = drawingObjects;

  // 마운트 시 첫 번째 심볼 초기 로드
  useEffect(() => {
    prevSymbolRef.current = symbol;
    setDrawingObjects(loadFromStorage(symbol));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 심볼 변경 시: 새 심볼의 저장값 로드
  // (이전 심볼 데이터는 아래 save effect에서 이미 저장되어 있음)
  useEffect(() => {
    if (prevSymbolRef.current === null || prevSymbolRef.current === symbol) return;
    prevSymbolRef.current = symbol;
    setDrawingObjects(loadFromStorage(symbol));
  }, [symbol, setDrawingObjects]);

  // drawingObjects 변경 시 현재 심볼로 자동 저장
  useEffect(() => {
    if (prevSymbolRef.current === null) return; // 초기 로드 전
    saveToStorage(symbol, drawingObjects);
  }, [drawingObjects, symbol]);
};
