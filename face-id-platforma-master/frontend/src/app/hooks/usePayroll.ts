import { useState, useEffect, useCallback } from 'react';
import { payrollAPI } from '../api/payroll';

export function usePayrollRecords() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const res = await payrollAPI.myRecords();
            setRecords(res.data.results || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);
    return { records, loading, refetch: fetchRecords };
}
