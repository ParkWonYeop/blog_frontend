import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { jwtDecode } from 'jwt-decode';
import { refreshAccessToken } from '@/features/auth/authSession';
import { useAuthStore } from '@/features/auth/store';
import { API_BASE_URL } from '@/shared/lib/environment';
import type { OnlineClientMessage, OnlineServerMessage } from '@/shared/types';

export type ChessSocketStatus = 'idle' | 'connecting' | 'open' | 'ready' | 'closed' | 'replaced';

type MessageListener = (message: OnlineServerMessage) => void;
type StatusListener = (status: ChessSocketStatus) => void;

const SOCKET_URL = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/chess`;
const REPLACED_CLOSE_CODE = 4001;
const RELEASE_GRACE_MS = 1500;
const MAX_RETRY_MS = 10_000;

const getFreshAccessToken = async () => {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) return null;

  try {
    const { exp } = jwtDecode<{ exp?: number }>(accessToken);
    if (exp && exp * 1000 < Date.now() + 30_000) return await refreshAccessToken();
  } catch {
    return null;
  }

  return accessToken;
};

/** 탭당 하나의 체스 WebSocket. 화면이 쓰는 동안만 열어 두고, 끊기면 다시 붙는다. 서버는 계정당 최신 연결 하나만 유지한다. */
class ChessSocket {
  private ws: WebSocket | null = null;
  private status: ChessSocketStatus = 'idle';
  private readonly listeners = new Set<MessageListener>();
  private readonly statusListeners = new Set<StatusListener>();
  private consumers = 0;
  private retryDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;

  getStatus() {
    return this.status;
  }

  acquire() {
    this.consumers += 1;
    if (this.releaseTimer) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }
    if (!this.ws) this.connect();
  }

  release() {
    this.consumers = Math.max(0, this.consumers - 1);
    if (this.consumers > 0) return;

    // 페이지 이동 중 잠깐 0이 되는 경우를 위해 조금 기다렸다가 닫는다.
    this.releaseTimer = setTimeout(() => {
      this.releaseTimer = null;
      if (this.consumers === 0) this.disconnect();
    }, RELEASE_GRACE_MS);
  }

  reconnect() {
    this.disconnect();
    this.retryDelay = 1000;
    this.connect();
  }

  send(message: OnlineClientMessage) {
    if (!this.ws || this.status !== 'ready') return false;

    this.ws.send(JSON.stringify(message));
    return true;
  }

  subscribe(listener: MessageListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  onStatus(listener: StatusListener) {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private connect() {
    if (typeof window === 'undefined' || this.ws) return;

    this.setStatus('connecting');
    const ws = new WebSocket(SOCKET_URL);
    this.ws = ws;

    ws.onopen = async () => {
      if (this.ws !== ws) return;
      this.setStatus('open');
      const token = await getFreshAccessToken();
      if (!token) {
        ws.close();
        return;
      }
      ws.send(JSON.stringify({ type: 'AUTH', token }));
    };

    ws.onmessage = (event) => {
      let message: OnlineServerMessage;
      try {
        message = JSON.parse(String(event.data)) as OnlineServerMessage;
      } catch {
        return;
      }
      if (message.type === 'AUTH_OK') {
        this.retryDelay = 1000;
        this.setStatus('ready');
      }
      this.listeners.forEach((listener) => listener(message));
    };

    ws.onclose = (event) => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (event.code === REPLACED_CLOSE_CODE) {
        this.setStatus('replaced');
        return;
      }
      this.setStatus('closed');
      if (this.consumers > 0) this.scheduleReconnect();
    };
  }

  private disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const ws = this.ws;
    this.ws = null;
    ws?.close();
    this.setStatus('idle');
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.consumers > 0 && !this.ws) this.connect();
    }, this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, MAX_RETRY_MS);
  }

  private setStatus(status: ChessSocketStatus) {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}

export const chessSocket = new ChessSocket();

export const sendChessMessage = (message: OnlineClientMessage) => chessSocket.send(message);

const subscribeStatus = (listener: StatusListener) => chessSocket.onStatus(listener);
const getStatus = () => chessSocket.getStatus();
const getServerStatus = (): ChessSocketStatus => 'idle';

/** 컴포넌트가 떠 있는 동안 소켓을 열어 두고 연결 상태를 돌려준다. */
export function useChessSocket() {
  const status = useSyncExternalStore(subscribeStatus, getStatus, getServerStatus);

  useEffect(() => {
    chessSocket.acquire();

    return () => chessSocket.release();
  }, []);

  const reconnect = useCallback(() => chessSocket.reconnect(), []);

  return { status, send: sendChessMessage, reconnect };
}

/** 서버 메시지를 받는다. 핸들러가 바뀌어도 구독은 유지된다. */
export function useChessSocketMessage(handler: MessageListener) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => chessSocket.subscribe((message) => handlerRef.current(message)), []);
}
