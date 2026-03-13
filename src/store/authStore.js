import { create } from 'zustand';
import api from '../api/axiosInstance';

const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    loading: true,

    // Initialize auth from localStorage
    initAuth: () => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                set({
                    token: storedToken,
                    user: JSON.parse(storedUser),
                    loading: false
                });
            } catch (err) {
                console.error('Failed to parse user data:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ loading: false });
            }
        } else {
            set({ loading: false });
        }
    },

    // Fetch user data from backend
    fetchUser: async () => {
        const token = get().token || localStorage.getItem('token');

        if (!token) {
            set({ loading: false });
            return;
        }

        try {
            const response = await api.get('/auth/me');
            if (response.success) {
                set({ user: response.data, loading: false });
                localStorage.setItem('user', JSON.stringify(response.data));
            }
        } catch (err) {
            console.error('Failed to fetch user:', err);
            get().logout();
        }
    },

    // Login
    login: (userData, authToken) => {
        set({ user: userData, token: authToken, loading: false });
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    },

    // Logout
    logout: () => {
        set({ user: null, token: null, loading: false });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Check if authenticated
    isAuthenticated: () => {
        return !!get().token && !!get().user;
    },

    // Check if admin
    isAdmin: () => {
        return get().user?.role === 'admin';
    },

    // Check if salesperson
    isSalesperson: () => {
        return get().user?.role === 'salesperson';
    },

    // Check if employee
    isEmployee: () => {
        return get().user?.role === 'employee';
    }
}));

export default useAuthStore;
