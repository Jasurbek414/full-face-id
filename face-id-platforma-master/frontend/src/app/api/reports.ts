import { apiClient } from './client';

export const reportsAPI = {
    daily: (params: object) => apiClient.get('/api/v1/reports/daily/', { params }),
    weekly: (params: object) => apiClient.get('/api/v1/reports/weekly/', { params }),
    monthly: (params: object) => apiClient.get('/api/v1/reports/monthly/', { params }),
    summary: (params: object) => apiClient.get('/api/v1/reports/summary/', { params }),
    lateAnalysis: (params: object) => apiClient.get('/api/v1/reports/late-analysis/', { params }),
};
