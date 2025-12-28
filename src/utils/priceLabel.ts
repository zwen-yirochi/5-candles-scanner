/**
 * Price label utilities for chart axis
 */

/**
 * Get nice-looking price labels for the given range
 */

export const getVisiblePriceLabels = (
    minPrice: number,
    maxPrice: number,
    maxLabels: number = 10
): { labels: number[]; step: number } => {
    const range = maxPrice - minPrice;

    // Calculate nice step size
    const roughStep = range / (maxLabels - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));

    // Round to nice numbers (1, 2, 5)
    const normalized = roughStep / magnitude;
    let step: number;
    if (normalized <= 1) step = magnitude;
    else if (normalized <= 2) step = 2 * magnitude;
    else if (normalized <= 5) step = 5 * magnitude;
    else step = 10 * magnitude;

    // Generate labels
    const firstLabel = Math.ceil(minPrice / step) * step;
    const labels: number[] = [];
    for (let price = firstLabel; price <= maxPrice; price += step) {
        labels.push(price);
    }

    // Ensure we have at least 2 labels
    if (labels.length < 2) {
        labels.push(minPrice, maxPrice);
    }

    return { labels, step };
};

/**
 * Format price based on step size
 */

export const formatPrice = (price: number, step: number): string => {
    // Determine decimal places based on step
    const decimals = step < 0.01 ? 4 : step < 1 ? 2 : 0;
    return price.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};
