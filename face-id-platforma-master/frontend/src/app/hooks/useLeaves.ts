import { useState, useEffect, useCallback } from 'react';
import { leavesAPI } from '../api/leaves';

export function useLeaveBalance() {
    const [balance, setBalance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBalance = useCallback(async () => {
        try {
            setLoading(true);
            const res = await leavesAPI.balance();
            setBalance(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBalance(); }, [fetchBalance]);
    return { balance, loading, refetch: fetchBalance };
}

export function useLeaveRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const res = await leavesAPI.myRequests();
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);
    return { requests, loading, refetch: fetchRequests };
}

export function useLeaveTypes() {
    const [types, setTypes] = useState<any[]>([]);

    useEffect(() => {
        leavesAPI.types().then(res => setTypes(res.data.results || res.data)).catch(console.error);
    }, []);

    return { types };
}
