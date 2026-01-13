import axios from 'axios';

// 1. Point this explicitly to your Railway Backend
const BASE_URL = 'https://intellitravel-production.up.railway.app/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true // IMPORTANT: This helps with Sanctum cookies if you use them
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
