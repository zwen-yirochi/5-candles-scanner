// src/types/editor.types.ts

export type ActiveToolType = 'hline' | 'trendline';
export type EditorToolType = 'none' | ActiveToolType;
export type EditorMode = 'pan' | 'draw' | 'select';

export interface BaseDrawingObject {
  id: string;
  tool: ActiveToolType;
  selected: boolean;
  color: string;
}

export interface HLineObject extends BaseDrawingObject {
  tool: 'hline';
  price: number;
}

export interface TrendlineObject extends BaseDrawingObject {
  tool: 'trendline';
  p1: { timestamp: number; price: number };
  p2: { timestamp: number; price: number };
}

export type DrawingObject = HLineObject | TrendlineObject;

export interface ToolDefinition {
  type: EditorToolType;
  label: string;
}
