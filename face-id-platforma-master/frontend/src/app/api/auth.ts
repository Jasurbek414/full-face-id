import { apiClient } from './client';

export const authAPI = {
    // Email-based login (asosiy)
    emailLogin: (email: string, password: string) =>
        apiClient.post('/api/v1/auth/email-login/', { email, password }),
    // Email registration step 1
    emailRegister: (data: Record<string, string>) =>
        apiClient.post('/api/v1/auth/email-register/', data),
    // Email OTP verify step 2
    emailVerify: (email: string, code: string) =>
        apiClient.post('/api/v1/auth/email-verify/', { email, code }),
    // Legacy phone login
    login: (phone: string, password: string) =>
        apiClient.post('/api/v1/auth/login/', { phone, password }),
    logout: (refresh: string) =>
        apiClient.post('/api/v1/auth/logout/', { refresh }),
    me: () => apiClient.get('/api/v1/auth/me/'),
    changePassword: (old_password: string, new_password: string) =>
        apiClient.post('/api/v1/auth/change-password/', { old_password, new_password }),
};
