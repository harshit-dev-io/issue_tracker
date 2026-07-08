import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios'; // <-- Use 'import type' here

export const api = axios.create({
  baseURL: "https://issue-tracker-zems.onrender.com",
  headers: { 'Content-Type': 'application/json' },
});

export const axiosPrivate = axios.create({
  baseURL: "https://issue-tracker-zems.onrender.com",
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor State
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return axiosPrivate(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        // Dispatch refresh call
        const { data } = await api.post('/auth/refresh/', { refresh_token: refreshToken });
        
        localStorage.setItem('refresh_token', data.refresh_token);
        axiosPrivate.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
        
        processQueue(null, data.access_token);
        
        // Expose a custom event so AuthContext can update in-memory state
        window.dispatchEvent(new CustomEvent('token_refreshed', { detail: data.access_token }));

        return axiosPrivate(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('auth_failed')); // Eject user
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);