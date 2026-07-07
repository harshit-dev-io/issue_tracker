import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Adjust to your actual backend URL port
});

// Request Interceptor: Attach the access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401s, refresh token, and retry automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the server returns a 401 and we haven't tried retrying this specific request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Attempt to fetch a new token pair using the refresh token
          const res = await axios.post('http://127.0.0.1:8000/auth/refresh/', {
            refresh_token: refreshToken,
          });

          // Save the fresh tokens
          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);

          // Update the authorization header for the retried request
          originalRequest.headers['Authorization'] = `Bearer ${res.data.access_token}`;
          
          // Retry the original failing request with the new token
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token expired or invalid. Force logging out.");
          // Clear storage and redirect to login page if refresh fails
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect immediately
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;