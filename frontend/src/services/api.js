import axios from "axios";
import authService from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Expired or bad token: drop it and go back to the login page.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLogin = error.config?.url?.includes("/auth/login");
    if (status === 401 && !isLogin) {
      authService.logout();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export default apiClient;
