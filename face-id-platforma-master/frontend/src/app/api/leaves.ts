import { apiClient } from './client';

export const leavesAPI = {
    balance: () => apiClient.get('/api/v1/leaves/requests/balance/'),
    types: () => apiClient.get('/api/v1/leaves/types/'),
    myRequests: () => apiClient.get('/api/v1/leaves/requests/my/'),
    createRequest: (data: any) => apiClient.post('/api/v1/leaves/requests/', data),
};
