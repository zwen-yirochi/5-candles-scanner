// src/hooks/useBinanceWebSocket.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import { BinanceWebSocketClient } from '../services/websocket/binanceWebSocket';
import { CandleData } from '../types/candle.types';
import { BinanceKlineWebSocketData } from '../types/websocket.types';

interface UseBinanceWebSocketParams {
  symbol: string;
  interval: string;
  enabled?: boolean;
}

interface UseBinanceWebSocketReturn {
  latestCandle: CandleData | null;
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
}

export const useBinanceWebSocket = ({
  symbol,
  interval,
  enabled = true,
}: UseBinanceWebSocketParams): UseBinanceWebSocketReturn => {
  const [latestCandle, setLatestCandle] = useState<CandleData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsClientRef = useRef<BinanceWebSocketClient | null>(null);
  const lastCandleRef = useRef<CandleData | null>(null);

  // ref 패턴: 콜백을 ref에 저장하여 effect 의존성에서 제외
  const onMessageRef = useRef<(data: BinanceKlineWebSocketData) => void>(undefined);
  onMessageRef.current = (data) => {
    try {
      if (!data || typeof data !== 'object') return;
      if (data.e === 'ping' || data.e === 'pong') return;
      if (data.e !== 'kline' || !data.k) return;

      const { k } = data;

      if (k.t == null || k.o == null || k.h == null || k.l == null || k.c == null || k.v == null) return;

      const newCandle: CandleData = {
        timestamp: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      };

      // 값이 동일하면 setState 스킵
      const prev = lastCandleRef.current;
      if (
        prev &&
        prev.timestamp === newCandle.timestamp &&
        prev.open === newCandle.open &&
        prev.high === newCandle.high &&
        prev.low === newCandle.low &&
        prev.close === newCandle.close &&
        prev.volume === newCandle.volume
      ) {
        return;
      }

      lastCandleRef.current = newCandle;
      setLatestCandle(newCandle);
    } catch (err) {
      console.error('Error processing message:', err);
      setError(err as Error);
    }
  };

  const onErrorRef = useRef<(err: Error) => void>(undefined);
  onErrorRef.current = (err) => {
    console.error('WebSocket error:', err);
    setError(err);
    setIsConnected(false);
  };

  /**
   * 수동 재연결
   */
  const reconnect = useCallback(() => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
      wsClientRef.current.connect();
    }
  }, []);

  /**
   * 네트워크 상태 모니터링
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network restored');
      if (wsClientRef.current && !wsClientRef.current.isConnected()) {
        wsClientRef.current.connect();
      }
    };

    const handleOffline = () => {
      console.log('Network lost');
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * 웹소켓 클라이언트 초기화 및 연결 관리
   * 의존성: symbol, interval, enabled만 — 콜백은 ref로 참조
   */
  useEffect(() => {
    if (!enabled) {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
      setIsConnected(false);
      setLatestCandle(null);
      setError(null);
      return;
    }

    wsClientRef.current = new BinanceWebSocketClient({
      symbol,
      interval,
      onMessage: (data) => onMessageRef.current?.(data),
      onError: (err) => onErrorRef.current?.(err),
      onConnect: () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      },
    });

    wsClientRef.current.connect();

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
    };
  }, [symbol, interval, enabled]);

  return {
    latestCandle,
    isConnected,
    error,
    reconnect,
  };
};
