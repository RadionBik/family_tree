import axios from 'axios';

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

// Optional: Add interceptors for request/response handling (e.g., error handling, token injection)
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Basic error handling placeholder
    console.error('API call error:', error.response || error.message);
    // You might want to show a user-friendly message or redirect
    return Promise.reject(error);
  }
);

export default apiClient;