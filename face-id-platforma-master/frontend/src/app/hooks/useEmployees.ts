import { useState, useCallback } from 'react';
import { employeesAPI } from '../api/employees';

export function useEmployees() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const list = useCallback(async (params?: any) => {
        setLoading(true);
        try {
            const response = await employeesAPI.list(params);
            setLoading(false);
            return response.data;
        } catch (err: any) {
            setError(err.message || 'Failed to fetch employees');
            setLoading(false);
            throw err;
        }
    }, []);

    const get = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const response = await employeesAPI.get(id);
            setLoading(false);
            return response.data;
        } catch (err: any) {
            setError(err.message || 'Failed to fetch employee');
            setLoading(false);
            throw err;
        }
    }, []);

    const enrollFace = useCallback(async (id: string, photo: string) => {
        setLoading(true);
        try {
            const response = await employeesAPI.faceEnroll(id, photo);
            setLoading(false);
            return response.data;
        } catch (err: any) {
            setError(err.message || 'Face enrollment failed');
            setLoading(false);
            throw err;
        }
    }, []);

    const deleteFace = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const response = await employeesAPI.faceDelete(id);
            setLoading(false);
            return response.data;
        } catch (err: any) {
            setError(err.message || 'Face deletion failed');
            setLoading(false);
            throw err;
        }
    }, []);

    const getAttendance = useCallback(async (id: string, params?: any) => {
        setLoading(true);
        try {
            const response = await employeesAPI.attendanceHistory(id, params);
            setLoading(false);
            return response.data;
        } catch (err: any) {
            setError(err.message || 'Failed to fetch attendance history');
            setLoading(false);
            throw err;
        }
    }, []);

    return { loading, error, list, get, enrollFace, deleteFace, getAttendance };
}
