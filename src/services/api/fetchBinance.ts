import axios from 'axios';
import { Binance24hrStats, BinanceResponse } from '../../types';

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

export const fetchBinance = async (
  symbol: string,
  interval: string, // timeframe -> interval로 수정 (Binance API 파라미터명)
  limit: number = 2400,
): Promise<BinanceResponse[]> => {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/klines`, {
      params: {
        symbol,
        interval,
        limit,
      },
    });

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
    console.error('Binance API Error:', error);
    throw new Error('Failed to fetch data from Binance API');
  }
};

export const fetch24hrStats = async (symbol: string): Promise<Binance24hrStats> => {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/ticker/24hr`, {
      params: {
        symbol,
      },
    });

    return {
      symbol: response.data.symbol,
      priceChange: response.data.priceChange,
      priceChangePercent: response.data.priceChangePercent,
      lastPrice: response.data.lastPrice,
      highPrice: response.data.highPrice,
      lowPrice: response.data.lowPrice,
      volume: response.data.volume,
    };
  } catch (error) {
    console.error('Binance 24hr Stats API Error:', error);
    throw new Error('Failed to fetch 24hr stats from Binance API');
  }
};
