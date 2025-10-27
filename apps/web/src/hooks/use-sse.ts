import { use, useEffect, useRef, useState } from "react";

type SSEOptions<T> = {
  url: string;
  onMessage?: (data: T) => void;
  onError?: (err: any) => void;
  heartbeatTimeout?: number;
};

export function useSSE<T extends { type: string } = any>(props: SSEOptions<T>) {
  const { url, onMessage, onError, heartbeatTimeout = 30000 } = props;
  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = () => {
    if (
      eventSourceRef.current &&
      (eventSourceRef.current.readyState === EventSource.OPEN ||
        eventSourceRef.current.readyState === EventSource.CONNECTING)
    ) {
      return;
    }

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as T;

      if (parsed?.type === "connected") {
        setConnected(true);
        return;
      }

      if (parsed?.type === "ping") {
        resetHeartbeat();
        return;
      }

      onMessage?.(parsed);
    };

    es.onerror = (err) => {
      setConnected(false);
      if (onError) onError(err);

      cleanup();
      connect();
    };
  };

  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (heartbeatTimer.current) clearTimeout(heartbeatTimer.current);
  };

  const resetHeartbeat = () => {
    if (heartbeatTimer.current) clearTimeout(heartbeatTimer.current);
    heartbeatTimer.current = setTimeout(() => {
      setConnected(false);
      cleanup();
      connect();
    }, heartbeatTimeout);
  };

  useEffect(() => {
    connect();
  }, []);

  return { connected };
}
