import axios from "axios";
import authService from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

console.log(`API Base URL: ${API_BASE_URL}`);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log("Attaching token to request headers.");
    } else {
      console.log("No token found, request sent without Authorization header.");
    }
    return config;
  },
  (error) => {
    console.error("Error attaching token to request:", error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Received 401 Unauthorized response. Logging out.");
    }

    console.error("API call error:", error.response || error.message);
    return Promise.reject(error);
  },
);

export default apiClient;
