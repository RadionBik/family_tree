import apiClient from "./api";

const login = async (username, password) => {
  const form = new URLSearchParams({ username, password });
  const response = await apiClient.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data;
};

const logout = () => localStorage.removeItem("adminToken");
const getToken = () => localStorage.getItem("adminToken");
const isLoggedIn = () => Boolean(getToken());

// Role is a claim in the JWT; the API enforces it, this only decides what to show.
const getRole = () => {
  try {
    const payload = JSON.parse(atob(getToken().split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
};
const isAdmin = () => getRole() === "admin";
const canEdit = () => ["admin", "editor"].includes(getRole());

export default {
  login,
  logout,
  getToken,
  isLoggedIn,
  getRole,
  isAdmin,
  canEdit,
};
