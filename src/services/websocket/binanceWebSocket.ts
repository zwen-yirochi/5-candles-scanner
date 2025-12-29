// src/services/websocket/binanceWebSocket.ts

import { BinanceKlineWebSocketData, WebSocketConfig } from '../../types/websocket.types';

const BINANCE_WS_BASE_URL = 'wss://stream.binance.com:9443/ws';

export class BinanceWebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 999;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  /**
   * 웹소켓 연결 시작
   */
  public connect(): void {
    this.isIntentionallyClosed = false;
    const { symbol, interval } = this.config;
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    const url = `${BINANCE_WS_BASE_URL}/${streamName}`;

    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * 웹소켓 이벤트 핸들러 설정
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.config.onConnect?.();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data: BinanceKlineWebSocketData = JSON.parse(event.data);
        this.config.onMessage?.(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      this.handleError(new Error('WebSocket error occurred'));
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.config.onDisconnect?.();

      // 의도적으로 닫은 경우가 아니면 재연결 시도
      if (!this.isIntentionallyClosed) {
        this.attemptReconnect();
      }
    };
  }

  /**
   * 재연결 시도
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.handleError(new Error('Failed to reconnect after maximum attempts'));
      return;
    }

    this.reconnectAttempts++;

    // 지수 백오프
    const exponentialDelay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const delay = Math.min(exponentialDelay, this.maxReconnectDelay);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 에러 처리
   */
  private handleError(error: Error): void {
    this.config.onError?.(error);
  }

  /**
   * 웹소켓 연결 종료
   */
  public disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * 연결 상태 확인
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<WebSocketConfig>): void {
    const needsReconnect = newConfig.symbol !== this.config.symbol || newConfig.interval !== this.config.interval;

    this.config = { ...this.config, ...newConfig };

    if (needsReconnect && this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }
}
