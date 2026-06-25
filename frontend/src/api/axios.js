import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'; // Default to 8000 for backend

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies (like refresh token)
});

// Request interceptor to attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiration and refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If error is 401 Unauthorized and not a login attempt, and not already retrying
    if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;
      try {
        // Attempt to refresh token
        const response = await axiosInstance.post('/auth/refresh-token'); // This endpoint should set new access token in cookie or return it
        const newAccessToken = response.data.accessToken; // Assuming backend returns new access token
        localStorage.setItem('accessToken', newAccessToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest); // Retry the original request
      } catch (refreshError) {
        // Refresh token failed or expired, force logout
        console.error('Unable to refresh token, forcing logout:', refreshError);
        localStorage.removeItem('accessToken');
        // Redirect to login page or show a message
        window.location.href = '/login'; // Or use react-router-dom's navigate
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
