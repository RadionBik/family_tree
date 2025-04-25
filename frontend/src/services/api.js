import axios from 'axios';
import authService from './authService'; // Import authService to get the token

// Define the base URL for the API.
// Use VITE_API_BASE_URL from environment variables (set in docker-compose or .env file)
// Fallback to localhost:8000 for local development outside Docker.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

console.log(`API Base URL: ${API_BASE_URL}`); // Log the URL being used

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Add other headers like Authorization if needed later
  },
});

// --- Request Interceptor ---
// Automatically attach the JWT token to requests if available
apiClient.interceptors.request.use(
  config => {
    const token = authService.getToken(); // Get token from authService (localStorage)
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Attaching token to request headers.');
    } else {
      console.log('No token found, request sent without Authorization header.');
    }
    return config;
  },
  error => {
    console.error('Error attaching token to request:', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// Optional: Add interceptors for response handling (e.g., global error handling, token refresh)
apiClient.interceptors.response.use(
  response => response, // Simply return successful responses
  error => {
    // Handle specific errors globally if needed (e.g., 401 Unauthorized might trigger logout)
    if (error.response && error.response.status === 401) {
      console.warn('Received 401 Unauthorized response. Logging out.');
      // Potentially redirect to login or clear user state
      // authService.logout(); // Example: logout on 401
      // window.location.href = '/login'; // Example: redirect
    }

    // Basic error handling placeholder
    console.error('API call error:', error.response || error.message);
    // You might want to show a user-friendly message or redirect
    return Promise.reject(error);
  }
);

export default apiClient;