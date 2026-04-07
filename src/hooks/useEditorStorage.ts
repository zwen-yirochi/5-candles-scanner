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
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${symbol}`, JSON.stringify(objects));
  } catch {
    // QuotaExceededError 등 저장 실패 시 무시
  }
}

export const useEditorStorage = () => {
  const symbol = useAtomValue(symbolAtom);
  const [drawingObjects, setDrawingObjects] = useAtom(drawingObjectsAtom);

  // 현재 표시 중인 심볼 (저장 키로 사용)
  const activeSymbolRef = useRef<string>(symbol);
  // 초기 로드 완료 여부
  const isInitializedRef = useRef(false);
  // 심볼 변경 시 이전 drawingObjects를 참조하기 위한 ref
  const drawingObjectsRef = useRef(drawingObjects);
  drawingObjectsRef.current = drawingObjects;

  // 마운트 시 초기 심볼 데이터 로드
  useEffect(() => {
    activeSymbolRef.current = symbol;
    isInitializedRef.current = true;
    setDrawingObjects(loadFromStorage(symbol));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 심볼 변경 시: 이전 심볼 저장 → 새 심볼 로드
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (activeSymbolRef.current === symbol) return;
    // drawingObjectsRef.current = 이전 심볼의 최신 데이터
    saveToStorage(activeSymbolRef.current, drawingObjectsRef.current);
    activeSymbolRef.current = symbol;
    setDrawingObjects(loadFromStorage(symbol));
  }, [symbol, setDrawingObjects]);

  // drawingObjects 변경 시 activeSymbolRef.current 키로 자동 저장
  // (symbol 대신 activeSymbolRef.current 사용 → 심볼 전환 중 잘못된 키에 저장 방지)
  useEffect(() => {
    if (!isInitializedRef.current) return;
    saveToStorage(activeSymbolRef.current, drawingObjects);
  }, [drawingObjects]);
};
