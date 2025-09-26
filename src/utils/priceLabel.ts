interface PriceLabelSet {
    step: number;
    minRange: number; // 이 step을 사용할 최소 범위
    labels: number[];
}

// 다양한 단위의 라벨을 미리 생성
const generateLabelSet = (min: number, max: number, step: number): number[] => {
    const labels: number[] = [];
    let current = Math.ceil(min / step) * step;

    while (current <= max) {
        labels.push(current);
        current += step;
    }

    return labels;
};

// 글로벌 라벨 세트 (앱 시작 시 한 번만 생성)
const PRICE_LABEL_SETS: PriceLabelSet[] = [
    { step: 50000, minRange: 200000, labels: generateLabelSet(0, 1000000, 50000) },
    { step: 20000, minRange: 100000, labels: generateLabelSet(0, 1000000, 20000) },
    { step: 10000, minRange: 50000, labels: generateLabelSet(0, 1000000, 10000) },
    { step: 5000, minRange: 20000, labels: generateLabelSet(0, 1000000, 5000) },
    { step: 2000, minRange: 10000, labels: generateLabelSet(0, 1000000, 2000) },
    { step: 1000, minRange: 5000, labels: generateLabelSet(0, 1000000, 1000) },
    { step: 500, minRange: 2000, labels: generateLabelSet(0, 1000000, 500) },
    { step: 200, minRange: 1000, labels: generateLabelSet(0, 1000000, 200) },
    { step: 100, minRange: 500, labels: generateLabelSet(0, 1000000, 100) },
    { step: 50, minRange: 200, labels: generateLabelSet(0, 1000000, 50) },
    { step: 20, minRange: 100, labels: generateLabelSet(0, 1000000, 20) },
    { step: 10, minRange: 50, labels: generateLabelSet(0, 1000000, 10) },
    { step: 5, minRange: 20, labels: generateLabelSet(0, 1000000, 5) },
    { step: 2, minRange: 10, labels: generateLabelSet(0, 1000000, 2) },
    { step: 1, minRange: 5, labels: generateLabelSet(0, 1000000, 1) },
    { step: 0.5, minRange: 2, labels: generateLabelSet(0, 1000000, 0.5) },
    { step: 0.1, minRange: 0, labels: generateLabelSet(0, 1000000, 0.1) },
];

export const getVisiblePriceLabels = (
    minPrice: number,
    maxPrice: number,
    maxLabelCount: number = 15
): { labels: number[]; step: number } => {
    const priceRange = maxPrice - minPrice;

    // 범위에 맞는 라벨 세트 선택
    const labelSet =
        PRICE_LABEL_SETS.find((set) => priceRange >= set.minRange) || PRICE_LABEL_SETS[PRICE_LABEL_SETS.length - 1];

    // 보이는 영역 내의 라벨만 필터링
    const visibleLabels = labelSet.labels.filter((label) => label >= minPrice && label <= maxPrice);

    // 너무 많으면 간격을 넓힘
    if (visibleLabels.length > maxLabelCount) {
        const skipFactor = Math.ceil(visibleLabels.length / maxLabelCount);
        return {
            labels: visibleLabels.filter((_, i) => i % skipFactor === 0),
            step: labelSet.step * skipFactor,
        };
    }

    return {
        labels: visibleLabels,
        step: labelSet.step,
    };
};

export const formatPrice = (price: number, step: number): string => {
    if (step >= 1) {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    } else if (step >= 0.1) {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });
    } else {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
};
