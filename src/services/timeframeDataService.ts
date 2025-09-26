// services/timeframeDataService.ts
import axios from 'axios';
import { TimeFrame } from '../stores/atoms/patternAtoms';
import { CandleData } from '../types/candle.types';

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

const timeframeToInterval: Record<TimeFrame, string> = {
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
};

export class TimeframeDataService {
    static async fetchAllTimeframes(symbol: string, limit: number = 100): Promise<Record<TimeFrame, CandleData[]>> {
        const results: Record<TimeFrame, CandleData[]> = {
            '15m': [],
            '30m': [],
            '1h': [],
            '4h': [],
        };

        console.log(`=== ${symbol} 타임프레임 데이터 로딩 시작 ===`);

        const timeframes: TimeFrame[] = ['15m', '30m', '1h', '4h'];

        try {
            const promises = timeframes.map(async (timeframe) => {
                const interval = timeframeToInterval[timeframe];
                const response = await axios.get(`${BINANCE_BASE_URL}/klines`, {
                    params: { symbol, interval, limit },
                });

                const data: CandleData[] = response.data.map(
                    (item: any[]): CandleData => ({
                        timestamp: item[0],
                        open: parseFloat(item[1]),
                        high: parseFloat(item[2]),
                        low: parseFloat(item[3]),
                        close: parseFloat(item[4]),
                        volume: parseFloat(item[5]),
                    })
                );

                console.log(`${timeframe} 데이터 로드 완료: ${data.length}개 캔들`);
                return { timeframe, data };
            });

            const responses = await Promise.allSettled(promises);

            responses.forEach((result) => {
                if (result.status === 'fulfilled') {
                    const { timeframe, data } = result.value;
                    results[timeframe] = data;
                } else {
                    console.error(`데이터 로드 실패:`, result.reason);
                }
            });

            console.log('=== 모든 타임프레임 데이터 로딩 완료 ===');
            return results;
        } catch (error) {
            console.error('타임프레임 데이터 로딩 오류:', error);
            return results;
        }
    }

    static async fetchSingleTimeframe(
        symbol: string,
        timeframe: TimeFrame,
        limit: number = 100
    ): Promise<CandleData[]> {
        try {
            const interval = timeframeToInterval[timeframe];
            const response = await axios.get(`${BINANCE_BASE_URL}/klines`, {
                params: { symbol, interval, limit },
            });

            return response.data.map(
                (item: any[]): CandleData => ({
                    timestamp: item[0],
                    open: parseFloat(item[1]),
                    high: parseFloat(item[2]),
                    low: parseFloat(item[3]),
                    close: parseFloat(item[4]),
                    volume: parseFloat(item[5]),
                })
            );
        } catch (error) {
            console.error(`${timeframe} 데이터 로드 실패:`, error);
            return [];
        }
    }
}
