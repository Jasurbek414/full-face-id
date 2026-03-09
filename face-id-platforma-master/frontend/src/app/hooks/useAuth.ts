import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
    const { user, loading, login, logout, setUser } = useAuthContext();

    return {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        setUser
    };
}
