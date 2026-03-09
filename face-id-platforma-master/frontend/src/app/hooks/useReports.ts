import { useState, useEffect, useCallback } from 'react';
import { reportsAPI } from '../api/reports';

export function useWeeklySummary() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const days = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha'];
            const results = await Promise.allSettled(
                Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return reportsAPI.summary({
                        date_from: d.toISOString().split('T')[0],
                        date_to: d.toISOString().split('T')[0],
                    }).then(res => ({
                        day: i === 6 ? 'Bugun' : days[d.getDay()],
                        present: res.data.present ?? 0,
                        late: res.data.late ?? 0,
                        absent: res.data.absent ?? 0,
                    }));
                })
            );
            setData(results.map((r, i) => {
                if (r.status === 'fulfilled') return r.value;
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return { day: i === 6 ? 'Bugun' : ['Yak','Du','Se','Ch','Pa','Ju','Sha'][d.getDay()], present: 0, late: 0, absent: 0 };
            }));
        } catch {
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);
    return { data, loading, refetch: fetchSummary };
}
