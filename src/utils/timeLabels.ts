interface LabelTier {
    ms: number;
    format: Intl.DateTimeFormatOptions;
}

// ms 오름차순 — 스케일에 맞는 최소 간격 선택용
const TIERS: LabelTier[] = [
    { ms: 30_000,           format: { hour: '2-digit', minute: '2-digit', second: '2-digit' } },
    { ms: 60_000,           format: { hour: '2-digit', minute: '2-digit' } },
    { ms: 5 * 60_000,      format: { hour: '2-digit', minute: '2-digit' } },
    { ms: 15 * 60_000,     format: { hour: '2-digit', minute: '2-digit' } },
    { ms: 30 * 60_000,     format: { hour: '2-digit', minute: '2-digit' } },
    { ms: 3_600_000,        format: { hour: '2-digit', minute: '2-digit' } },
    { ms: 2 * 3_600_000,   format: { day: 'numeric', hour: '2-digit' } },
    { ms: 4 * 3_600_000,   format: { day: 'numeric', hour: '2-digit' } },
    { ms: 6 * 3_600_000,   format: { day: 'numeric', hour: '2-digit' } },
    { ms: 12 * 3_600_000,  format: { month: 'short', day: 'numeric', hour: '2-digit' } },
    { ms: 86_400_000,       format: { month: 'short', day: 'numeric' } },
    { ms: 7 * 86_400_000,  format: { month: 'short', day: 'numeric' } },
    { ms: 30 * 86_400_000, format: { year: 'numeric', month: 'short' } },
];

const MIN_GAP_PX = 100;
const BUFFER = 2;

export interface TimeLabel {
    timestamp: number;
    x: number;
    text: string;
}

export function getTimeLabels(
    startTime: number,
    endTime: number,
    width: number,
): TimeLabel[] {
    if (startTime >= endTime || width <= 0) return [];

    const timeRange = endTime - startTime;
    const minMs = (timeRange / width) * MIN_GAP_PX;

    const tier = TIERS.find((t) => t.ms >= minMs) || TIERS[TIERS.length - 1];
    const iv = tier.ms;

    const first = Math.ceil((startTime - iv * BUFFER) / iv) * iv;
    const last = endTime + iv * BUFFER;

    const labels: TimeLabel[] = [];
    for (let ts = first; ts <= last; ts += iv) {
        labels.push({
            timestamp: ts,
            x: ((ts - startTime) / timeRange) * width,
            text: new Date(ts).toLocaleString('ko-KR', tier.format),
        });
    }

    return labels;
}
