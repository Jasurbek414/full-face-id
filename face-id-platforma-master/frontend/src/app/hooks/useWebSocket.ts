import { useEffect, useRef } from 'react';

export function useAttendanceWebSocket(onMessage: (data: any) => void) {
    const ws = useRef<WebSocket | null>(null);
    const onMessageRef = useRef(onMessage);
    const reconnectCount = useRef(0);
    const MAX_RETRIES = 3;

    // Keep callback ref up to date without re-triggering effect
    onMessageRef.current = onMessage;

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        let isMounted = true;

        const connect = () => {
            if (!isMounted || reconnectCount.current >= MAX_RETRIES) return;

            try {
                const wsBase = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws').replace(/\/$/, '');
                const socket = new WebSocket(`${wsBase}/attendance/?token=${token}`);
                ws.current = socket;

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        onMessageRef.current(data);
                    } catch {
                        // ignore parse errors
                    }
                };

                socket.onerror = () => {
                    // silently fail — WS is optional enhancement
                };

                socket.onclose = (e) => {
                    if (!isMounted) return;
                    // Only retry on abnormal closure and within limit
                    if (e.code !== 1000 && e.code !== 4001 && e.code !== 4002) {
                        reconnectCount.current += 1;
                        if (reconnectCount.current < MAX_RETRIES) {
                            setTimeout(connect, 5000 * reconnectCount.current);
                        }
                    }
                };
            } catch {
                // WebSocket creation failed — skip silently
            }
        };

        connect();

        return () => {
            isMounted = false;
            ws.current?.close(1000, 'component unmounted');
            ws.current = null;
        };
    }, []); // empty deps — intentional, uses refs

    return ws;
}
