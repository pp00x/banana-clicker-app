import axios from 'axios';

// Create a custom instance of axios
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
apiClient.interceptors.request.use(
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      const { status } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        const currentPath = window.location.pathname;
        // Only perform session cleanup and redirect if not on auth pages
        // and if the error is a general session expiry, not a specific login/register failure
        // which should be handled by the respective page components.
        if (currentPath !== '/login' && currentPath !== '/register') {
          localStorage.removeItem('token');
          localStorage.removeItem('user'); // Also clear user data
          window.location.href = '/login';
        }
        // If on /login or /register, the specific error (e.g. "Invalid credentials")
        // should be thrown by authService and handled by the page to show a message,
        // not cause a page reload here.
      }
      
      // Return server error message if available
      if (error.response.data && error.response.data.message) {
        return Promise.reject(new Error(error.response.data.message));
      }
    }
    
    // Generic error message
    return Promise.reject(
      new Error(error.message || 'An unexpected error occurred')
    );
  }
);

export default apiClient;