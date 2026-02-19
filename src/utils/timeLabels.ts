interface TimeLabelSet {
    interval: number; // 밀리초
    minRange: number; // 이 간격을 사용할 최소 시간 범위
    format: Intl.DateTimeFormatOptions;
    description: string;
    timestamps: number[]; // 미리 생성된 타임스탬프
}

// 기준 시간 (2020년 1월 1일 00:00:00)
const BASE_TIME = new Date('2020-01-01T00:00:00Z').getTime();
const END_TIME = new Date('2030-01-01T00:00:00Z').getTime();

const generateTimestamps = (start: number, end: number, interval: number): number[] => {
    const timestamps: number[] = [];
    let current = start;

    while (current <= end) {
        timestamps.push(current);
        current += interval;
    }

    return timestamps;
};

// 전역 시간 라벨 세트 (앱 시작 시 한 번만 생성)
export const TIME_LABEL_SETS: TimeLabelSet[] = [
    {
        interval: 86400000 * 30, // 30일
        minRange: 86400000 * 365, // 1년 이상
        format: { year: 'numeric', month: 'short' },
        description: '월',
        timestamps: generateTimestamps(BASE_TIME, END_TIME, 86400000 * 30),
    },
    {
        interval: 86400000 * 7, // 7일
        minRange: 86400000 * 90, // 90일 이상
        format: { month: 'short', day: 'numeric' },
        description: '주',
        timestamps: generateTimestamps(BASE_TIME, END_TIME, 86400000 * 7),
    },
    {
        interval: 86400000, // 1일
        minRange: 86400000 * 20, // 20일 이상
        format: { month: 'short', day: 'numeric' },
        description: '일',
        timestamps: generateTimestamps(BASE_TIME, END_TIME, 86400000),
    },
    {
        interval: 3600000 * 12, // 12시간
        minRange: 86400000 * 7, // 7일 이상
        format: { month: 'short', day: 'numeric', hour: '2-digit' },
        description: '12시간',
        timestamps: generateTimestamps(BASE_TIME, END_TIME, 3600000 * 12),
    },
    {
        interval: 3600000 * 4, // 4시간
        minRange: 86400000 * 2, // 2일 이상
        format: { day: 'numeric', hour: '2-digit' },
        description: '4시간',
        timestamps: generateTimestamps(BASE_TIME, END_TIME, 3600000 * 4),
    },
    {
        interval: 3600000, // 1시간
        minRange: 3600000 * 12, // 12시간 이상
        format: { day: 'numeric', hour: '2-digit' },
        description: '1시간',
        timestamps: generateTimestamps(BASE_TIME, END_TIME, 3600000),
    },
    {
        interval: 900000, // 15분
        minRange: 3600000 * 4, // 4시간 이상
        format: { hour: '2-digit', minute: '2-digit' },
        description: '15분',
        timestamps: generateTimestamps(BASE_TIME, END_TIME, 900000),
    },
    {
        interval: 300000, // 5분
        minRange: 3600000, // 1시간 이상
        format: { hour: '2-digit', minute: '2-digit' },
        description: '5분',
        timestamps: generateTimestamps(BASE_TIME, END_TIME, 300000),
    },
    {
        interval: 60000, // 1분
        minRange: 600000, // 10분 이상
        format: { hour: '2-digit', minute: '2-digit' },
        description: '1분',
        timestamps: generateTimestamps(BASE_TIME, END_TIME, 60000),
    },
    {
        interval: 30000, // 30초
        minRange: 0,
        format: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
        description: '30초',
        timestamps: generateTimestamps(BASE_TIME, END_TIME, 30000),
    },
];

export const indexToTimestamp = (
    index: number,
    ref: { index: number; timestamp: number },
    intervalMs: number
): number => {
    return ref.timestamp + (index - ref.index) * intervalMs;
};

export const getVisibleTimeLabels = (
    startTime: number,
    endTime: number,
    maxLabelCount: number = 8
): { timestamps: number[]; format: Intl.DateTimeFormatOptions; interval: number } => {
    if (startTime >= endTime) return { timestamps: [], format: {}, interval: 0 };

    const timeRange = endTime - startTime;

    // 적절한 라벨 세트 선택
    const labelSet =
        TIME_LABEL_SETS.find((set) => timeRange >= set.minRange) || TIME_LABEL_SETS[TIME_LABEL_SETS.length - 1];

    // 보이는 범위 내의 타임스탬프만 필터링
    const visibleTimestamps = labelSet.timestamps.filter(
        (ts) => ts >= startTime && ts <= endTime
    );

    // 너무 많으면 간격 조정
    if (visibleTimestamps.length > maxLabelCount) {
        const step = Math.ceil(visibleTimestamps.length / maxLabelCount);
        return {
            timestamps: visibleTimestamps.filter((_, i) => i % step === 0),
            format: labelSet.format,
            interval: labelSet.interval * step,
        };
    }

    return {
        timestamps: visibleTimestamps,
        format: labelSet.format,
        interval: labelSet.interval,
    };
};


export const formatTimestamp = (
    timestamp: number,
    format: Intl.DateTimeFormatOptions,
    locale: string = 'ko-KR'
): string => {
    return new Date(timestamp).toLocaleString(locale, format);
};
