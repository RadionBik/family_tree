import apiClient from './api';

const getUpcomingBirthdays = (days = 30) => {
  // Placeholder: Replace with actual API call when backend is ready
  console.log(`Fetching upcoming birthdays for the next ${days} days...`);
  // Example API call structure:
  // return apiClient.get(`/upcoming-birthdays?days=${days}`);

  // Return mock data for now to avoid errors
  return Promise.resolve({
    data: [
      // Keep placeholder data consistent with BirthdayTimeline.jsx for now
      { id: 1, name: 'Иван Петров', date: '25 апреля', age: 30 },
      { id: 2, name: 'Мария Сидорова', date: '1 мая', age: 25 },
      { id: 3, name: 'Алексей Иванов', date: '15 мая', age: 42 },
    ]
  });
};

export default {
  getUpcomingBirthdays,
};