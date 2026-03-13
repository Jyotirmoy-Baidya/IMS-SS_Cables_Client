import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

/* =========================
   REQUEST INTERCEPTOR
   Add Authorization token to all requests
========================= */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */
api.interceptors.response.use(
    (response) => response.data, // 👈 always return res.data
    (error) => {
        return Promise.reject(
            error.response?.data || {
                success: false,
                message: "Something went wrong",
            }
        );
    }
);

export default api;
