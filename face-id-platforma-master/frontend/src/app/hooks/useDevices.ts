import { useState, useCallback } from 'react';
import { devicesAPI } from '../api/devices';

export function useDevices() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const list = useCallback(async () => {
        setLoading(true);
        try {
            const response = await devicesAPI.list();
            setLoading(false);
            return response.data;
        } catch (err: any) {
            setError(err.message || 'Failed to fetch devices');
            setLoading(false);
            throw err;
        }
    }, []);

    const create = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const response = await devicesAPI.create(data);
            setLoading(false);
            return response.data;
        } catch (err: any) {
            setError(err.message || 'Failed to create device');
            setLoading(false);
            throw err;
        }
    }, []);

    return { loading, error, list, create };
}
