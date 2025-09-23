import axios from 'axios';
import { BinanceResponse } from '../../components/ChartContainer';

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

export const fetchBinance = async (
    symbol: string,
    interval: string, // timeframe -> interval로 수정 (Binance API 파라미터명)
    limit: number = 100
): Promise<BinanceResponse[]> => {
    try {
        const response = await axios.get(`${BINANCE_BASE_URL}/klines`, {
            params: {
                symbol,
                interval, // timeframe가 아니라 interval이 맞음
                limit,
            },
        });

        // Binance API는 배열 형태로 데이터를 반환
        return response.data.map((item: any[]) => ({
            openTime: item[0],
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
            volume: item[5],
            closeTime: item[6],
            quoteVolume: item[7],
            trades: item[8],
            buyBaseVolume: item[9],
            buyQuoteVolume: item[10],
        }));
    } catch (error) {
        console.error('Binance API 오류:', error);
        throw error;
    }
};
