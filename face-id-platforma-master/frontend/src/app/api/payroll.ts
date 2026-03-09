import { apiClient } from './client';

export const payrollAPI = {
    myRecords: () => apiClient.get('/api/v1/payroll/records/my/'),
};
