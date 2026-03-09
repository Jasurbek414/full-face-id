import { useEffect, useRef } from 'react';

export function useAttendanceWebSocket(onMessage: (data: any) => void) {
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws').replace(/\/$/, '');
        ws.current = new WebSocket(`${wsUrl}/attendance/?token=${token}`);

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('WS message parse error:', error);
            }
        };

        ws.current.onerror = () => {
            console.warn('WS connection error');
        };

        ws.current.onclose = () => {
            console.log('WS connection closed');
        };

        return () => {
            ws.current?.close();
        };
    }, [onMessage]);

    return ws.current;
}
