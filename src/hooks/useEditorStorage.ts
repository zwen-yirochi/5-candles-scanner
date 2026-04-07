// src/hooks/useEditorStorage.ts
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { symbolAtom } from '../stores/atoms/chartConfigAtoms';
import { drawingObjectsAtom } from '../stores/atoms/editorAtoms';
import { DrawingObject } from '../types/editor.types';

const STORAGE_KEY_PREFIX = 'editor_drawings_';

function isValidDrawingObject(obj: unknown): obj is DrawingObject {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.color !== 'string') return false;
  if (o.tool === 'hline') return typeof o.price === 'number';
  if (o.tool === 'trendline') {
    const p1 = o.p1 as Record<string, unknown> | undefined;
    const p2 = o.p2 as Record<string, unknown> | undefined;
    return (
      !!p1 && typeof p1.index === 'number' && typeof p1.price === 'number' &&
      !!p2 && typeof p2.index === 'number' && typeof p2.price === 'number'
    );
  }
  return false;
}

function loadFromStorage(symbol: string): DrawingObject[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${symbol}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidDrawingObject);
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
  // 첫 번째 실행(초기 렌더, drawingObjects=[])은 건너뛰고 초기화 플래그만 설정
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }
    saveToStorage(activeSymbolRef.current, drawingObjects);
  }, [drawingObjects]);
};
