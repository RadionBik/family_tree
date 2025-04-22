import apiClient from './api';

const subscribe = (name, email) => {
  // Placeholder: Replace with actual API call when backend is ready
  console.log('Submitting subscription via API...');
  // Example API call structure:
  // return apiClient.post('/subscribe', { name, email });

  // Return mock response for now
  return Promise.resolve({ data: { message: 'Subscription successful (mock)' } });
};

// Add unsubscribe function later if needed

export default {
  subscribe,
};