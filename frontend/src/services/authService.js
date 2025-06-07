import apiClient from "./api";

const login = async (username, password) => {
  console.log(`Attempting admin login for ${username}...`);
  try {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await apiClient.post("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response.data.access_token) {
      console.log("Login successful, token received.");
    }
    return response.data;
  } catch (error) {
    console.error(
      "Admin login API call failed:",
      error.response || error.message,
    );
    throw error;
  }
};

const logout = () => {
  console.log("Logging out admin...");
  localStorage.removeItem("adminToken");
};

const getToken = () => {
  return localStorage.getItem("adminToken");
};

const isLoggedIn = () => {
  return !!getToken();
};

export default {
  login,
  logout,
  getToken,
  isLoggedIn,
};
