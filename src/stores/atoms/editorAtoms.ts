// src/stores/atoms/editorAtoms.ts
import { atom } from 'jotai';
import { DrawingObject, EditorMode, EditorToolType } from '../../types/editor.types';

// 현재 에디터 모드
// 'pan': 기본 차트 조작 (드로잉 없음)
// 'draw': 툴이 선택되어 그리기 대기 중
// 'select': 객체가 선택되어 이동/삭제 가능
export const editorModeAtom = atom<EditorMode>('pan');

// 현재 선택된 툴 ('none' = Pan 모드)
export const activeToolAtom = atom<EditorToolType>('none');

// 저장된 드로잉 객체 목록
export const drawingObjectsAtom = atom<DrawingObject[]>([]);

// 현재 선택된 객체 ID
export const selectedObjectIdAtom = atom<string | null>(null);

// 그리는 중인 임시 객체 (추세선 p1 확정 후 p2 미리보기용)
export const draftObjectAtom = atom<DrawingObject | null>(null);
