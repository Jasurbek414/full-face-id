import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

interface AuthContextType {
    user: any;
    loading: boolean;
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
    setUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const response = await authAPI.me();
                setUser(response.data);
            } catch {
                localStorage.clear();
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await authAPI.emailLogin(email, password);
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        if (data.user?.company?.id) {
            localStorage.setItem('company_id', data.user.company.id);
        }
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        const refresh = localStorage.getItem('refresh_token') || '';
        try {
            await authAPI.logout(refresh);
        } catch {
            // ignore
        } finally {
            localStorage.clear();
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
