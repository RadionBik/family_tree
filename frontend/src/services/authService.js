import apiClient from './api';

const login = (username, password) => {
  // Placeholder: Replace with actual API call when backend is ready
  console.log('Attempting admin login via API...');
  // Example API call structure:
  // return apiClient.post('/admin/login', { username, password });

  // Return mock response for now
  // Simulate success/failure based on dummy credentials if needed
  if (username === 'admin' && password === 'password') {
    return Promise.resolve({ data: { token: 'fake-jwt-token', message: 'Login successful' } });
  } else {
    return Promise.reject({ response: { data: { message: 'Invalid credentials' } } });
  }
};

// Add logout, check status functions later if needed

export default {
  login,
};