import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

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
