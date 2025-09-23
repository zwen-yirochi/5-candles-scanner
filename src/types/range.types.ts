// range.types.ts - 화면 공간
export interface PixelRange {
    x: number; // 0 ~ width
    y: number; // 0 ~ height
}

export interface ChartRange {
    width: number; // 800px
    height: number; // 400px
}

export interface ViewportRange extends ChartRange {
    offsetX: number; // 차트 시작 위치
    offsetY: number;
}
