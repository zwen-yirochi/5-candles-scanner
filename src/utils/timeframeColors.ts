// constants/timeframeColors.ts
export type TimeFrame = '15m' | '30m' | '1h' | '4h';

export interface TimeframeColor {
    bullish: string;
    bearish: string;
    bg: {
        bullish: string;
        bearish: string;
    };
}

export const TIMEFRAME_COLORS: Record<TimeFrame, TimeframeColor> = {
    '15m': {
        bullish: '#10b981',
        bearish: '#f59e0b',
        bg: {
            bullish: 'rgba(16, 185, 129, 0.2)',
            bearish: 'rgba(245, 158, 11, 0.2)',
        },
    },
    '30m': {
        bullish: '#3b82f6',
        bearish: '#ef4444',
        bg: {
            bullish: 'rgba(59, 130, 246, 0.2)',
            bearish: 'rgba(239, 68, 68, 0.2)',
        },
    },
    '1h': {
        bullish: '#8b5cf6',
        bearish: '#f97316',
        bg: {
            bullish: 'rgba(139, 92, 246, 0.2)',
            bearish: 'rgba(249, 115, 22, 0.2)',
        },
    },
    '4h': {
        bullish: '#06b6d4',
        bearish: '#dc2626',
        bg: {
            bullish: 'rgba(6, 182, 212, 0.2)',
            bearish: 'rgba(220, 38, 38, 0.2)',
        },
    },
};

export const TIMEFRAME_LABELS: Record<TimeFrame, string> = {
    '15m': '15분',
    '30m': '30분',
    '1h': '1시간',
    '4h': '4시간',
};
