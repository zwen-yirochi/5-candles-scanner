export interface IndexDomain {
    startIndex: number;
    endIndex: number;
}

export interface PriceDomain {
    minPrice: number;
    maxPrice: number;
}

export interface ChartDomain {
    index: IndexDomain;
    price: PriceDomain;
}
