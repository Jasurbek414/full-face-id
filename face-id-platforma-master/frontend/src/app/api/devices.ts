import { apiClient } from './client';

export const devicesAPI = {
    list: (params?: Record<string, string>) =>
        apiClient.get('/api/v1/devices/', { params }),
    get: (id: string) => apiClient.get(`/api/v1/devices/${id}/`),
    create: (data: object) => apiClient.post('/api/v1/devices/', data),
    update: (id: string, data: object) => apiClient.patch(`/api/v1/devices/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/api/v1/devices/${id}/`),
    testConnection: (id: string) => apiClient.post(`/api/v1/devices/${id}/test-connection/`),
    logs: (id: string) => apiClient.get(`/api/v1/devices/${id}/logs/`),
};

export const companyUsersAPI = {
    list: () => apiClient.get('/api/v1/auth/company-users/'),
    create: (data: object) => apiClient.post('/api/v1/auth/company-users/', data),
    update: (id: string, data: object) =>
        apiClient.patch(`/api/v1/auth/company-users/${id}/`, data),
    deactivate: (id: string) => apiClient.delete(`/api/v1/auth/company-users/${id}/`),
};

export const rolesAPI = {
    list: () => apiClient.get('/api/v1/roles/roles/'),
};
