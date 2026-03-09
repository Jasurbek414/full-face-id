import { apiClient } from './client';

export const attendanceAPI = {
    today: () =>
        apiClient.get('/api/v1/attendance/today/'),
    live: () =>
        apiClient.get('/api/v1/attendance/live/'),
    list: (params?: {
        date_from?: string; date_to?: string;
        department?: string; status?: string;
        search?: string; page?: number;
    }) => apiClient.get('/api/v1/attendance/', { params }),
    summary: (params?: object) =>
        apiClient.get('/api/v1/attendance/summary/', { params }),
    checkIn: (method: string, extra?: object) =>
        apiClient.post('/api/v1/attendance/check-in/', { method, ...extra }),
    checkOut: () =>
        apiClient.post('/api/v1/attendance/check-out/', {}),
    breakStart: () =>
        apiClient.post('/api/v1/attendance/break/start/', {}),
    breakEnd: () =>
        apiClient.post('/api/v1/attendance/break/end/', {}),
};
