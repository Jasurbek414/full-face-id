import { apiClient } from './client';

export const employeesAPI = {
    list: (params?: { department?: string; status?: string; search?: string; page?: number }) =>
        apiClient.get('/api/v1/employees/', { params }),
    get: (id: string) =>
        apiClient.get(`/api/v1/employees/${id}/`),
    create: (data: object) =>
        apiClient.post('/api/v1/employees/', data),
    update: (id: string, data: object) =>
        apiClient.patch(`/api/v1/employees/${id}/`, data),
    deactivate: (id: string) =>
        apiClient.post(`/api/v1/employees/${id}/deactivate/`),
    faceEnroll: (id: string, base64photo: string) =>
        apiClient.post(`/api/v1/employees/${id}/face/`, { photo: base64photo }),
    faceDelete: (id: string) =>
        apiClient.delete(`/api/v1/employees/${id}/face/`),
    attendanceHistory: (id: string, params?: object) =>
        apiClient.get(`/api/v1/employees/${id}/attendance/`, { params }),
};
