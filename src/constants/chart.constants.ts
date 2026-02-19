export const CHART_SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' },
  { value: 'SOLUSDT', label: 'SOL/USDT' },
] as const;

export const CHART_INTERVALS = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
] as const;

export const DEFAULT_SYMBOL = 'BTCUSDT';
export const DEFAULT_INTERVAL = '1h';
export const DEFAULT_LIMIT = 1000;

export const CHART_DIMENSIONS = {
  DEFAULT_WIDTH: 1120,
  DEFAULT_HEIGHT: 880,
  AXIS_HEIGHT: 60,
  AXIS_WIDTH: 80,
} as const;

export const CHART_COLORS = {
  RISING: {
    body: 'bg-gray-800',
    border: 'border-gray-800',
    text: 'text-gray-800',
  },

  FALLING: {
    body: 'bg-gray-300',
    border: 'border-gray-300',
    text: 'text-gray-400',
  },

  GRID: 'border-gray-200',
  BACKGROUND: 'bg-[#F5F5F0]',
} as const;

export const CANDLESTICK = {
  BODY_WIDTH_RATIO: 0.7,
  BODY_OFFSET_RATIO: 0.15,
  MIN_BODY_HEIGHT: 4,
  WICK_WIDTH: 1,
} as const;

export const AXIS = {
  PRICE: {
    LABEL_COUNT: 5,
    MIN_RANGE: 100,
    ZOOM_SENSITIVITY: 0.01,
  },

  TIME: {
    MIN_RANGE: 10,
    ZOOM_SENSITIVITY: 0.01,
  },
} as const;

export const GRID = {
  HORIZONTAL_LINES: [0, 0.2, 0.4, 0.6, 0.8, 1],
} as const;
