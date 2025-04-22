import apiClient from './api';

const getFamilyTreeData = () => {
  // Placeholder: Replace with actual API call when backend is ready
  console.log('Fetching family tree data...');
  // Example API call structure:
  // return apiClient.get('/family-tree');

  // Return mock data for now
  return Promise.resolve({ data: { /* Mock tree structure */ } });
};

export default {
  getFamilyTreeData,
};