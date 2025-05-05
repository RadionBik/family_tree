import apiClient from './api';

// Function to handle admin login API call
const login = async (username, password) => {
  console.log(`Attempting admin login for ${username}...`);
  try {
    // FastAPI's OAuth2PasswordRequestForm expects form data
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Assuming the response contains { access_token: "...", token_type: "bearer" }
    if (response.data.access_token) {
      console.log("Login successful, token received.");
      // Token storage is handled by the component calling login
      // Optionally store user info if returned, or fetch it via /me
    }
    return response.data; // Return the token data
  } catch (error) {
    console.error('Admin login API call failed:', error.response || error.message);
    // Re-throw the error so the component can handle it
    throw error;
  }
};

// Function to handle logout (e.g., remove token)
const logout = () => {
  console.log("Logging out admin...");
  localStorage.removeItem('adminToken');
  // Optionally call a backend logout endpoint if it exists (e.g., for token blocklisting)
};

// Function to get the stored token
const getToken = () => {
  return localStorage.getItem('adminToken');
};

// Function to check if user is logged in (basic check)
const isLoggedIn = () => {
  return !!getToken();
};


export default {
  login,
  logout,
  getToken,
  isLoggedIn,
};