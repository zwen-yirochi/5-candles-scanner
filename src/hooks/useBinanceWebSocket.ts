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

  /**
   * 웹소켓 메시지 처리
   */
  const handleMessage = useCallback((data: BinanceKlineWebSocketData) => {
    try {
      // 메시지 타입 검증
      if (!data || typeof data !== 'object') return;
      if (data.e === 'ping' || data.e === 'pong') return;
      if (data.e !== 'kline' || !data.k) return;

      const { k } = data;

      // 필수 필드 검증
      if (!k.t || !k.o || !k.h || !k.l || !k.c || !k.v) return;

      // 데이터 변환
      const candleData: CandleData = {
        timestamp: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      };

      setLatestCandle(candleData);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Error processing message:', err);
      setError(err as Error);
    }
  }, []);

  /**
   * 웹소켓 에러 처리
   */
  const handleError = useCallback((err: Error) => {
    console.error('WebSocket error:', err);
    setError(err);
    setIsConnected(false);
  }, []);

  /**
   * 웹소켓 연결 처리
   */
  const handleConnect = useCallback(() => {
    console.log('WebSocket connected');
    setIsConnected(true);
    setError(null);
  }, []);

  /**
   * 웹소켓 연결 해제 처리
   */
  const handleDisconnect = useCallback(() => {
    console.log('WebSocket disconnected');
    setIsConnected(false);
  }, []);

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
   */
  useEffect(() => {
    if (!enabled) {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
      return;
    }

    // 웹소켓 클라이언트 생성
    wsClientRef.current = new BinanceWebSocketClient({
      symbol,
      interval,
      onMessage: handleMessage,
      onError: handleError,
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
    });

    // 연결 시작
    wsClientRef.current.connect();

    // 클린업: 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
    };
  }, [symbol, interval, enabled, handleMessage, handleError, handleConnect, handleDisconnect]);

  return {
    latestCandle,
    isConnected,
    error,
    reconnect,
  };
};
