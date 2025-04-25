import apiClient from './api';

/**
 * Subscribes an email address via the API.
 * @param {string} email - The email address to subscribe.
 * @returns {Promise<object>} - The response data from the API.
 */
const subscribe = async (email) => {
  console.log(`Submitting subscription for ${email} via API...`);
  try {
    // Make the POST request to the backend /subscribe endpoint
    const response = await apiClient.post('/subscribe', { email });
    // Return the data part of the response on success (e.g., { message: '...', subscription: {...} })
    return response.data;
  } catch (error) {
    // Log the error for debugging
    console.error('Subscription API call failed:', error.response || error.message);
    // Re-throw the error so the component can handle it (e.g., display a message)
    // Axios errors often have useful info in error.response.data
    throw error;
  }
};

// Add unsubscribe function later if needed

export default {
  subscribe,
};