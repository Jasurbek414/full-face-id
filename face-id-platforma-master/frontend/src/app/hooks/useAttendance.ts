import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI } from '../api/attendance';

export function useLiveAttendance() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        try {
            const response = await attendanceAPI.live();
            setData(response.data.results || response.data);
        } catch (error) {
            console.warn('Live attendance API failed:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
        const interval = setInterval(fetch, 30000); // 30s update
        return () => clearInterval(interval);
    }, [fetch]);

    return { data, loading, refetch: fetch };
}

export function useAttendanceList(params?: any) {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await attendanceAPI.list(params);
                setData(response.data.results || response.data);
                setTotal(response.data.count || response.data.length);
            } catch (error) {
                console.warn('Attendance list API failed:', error);
                setData([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [JSON.stringify(params)]);

    return { data, total, loading };
}
