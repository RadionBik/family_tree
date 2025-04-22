import apiClient from './api';

const getFamilyTreeData = async () => {
  console.log('Fetching family tree data from API...');
  try {
    const response = await apiClient.get('/family/tree'); // Use the correct endpoint
    return response.data; // Return the actual data from the response
  } catch (error) {
    console.error('Error fetching family tree data:', error);
    // Re-throw the error or return a specific error structure
    throw error;
  }
};

export default {
  getFamilyTreeData,
};