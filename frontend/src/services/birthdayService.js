import apiClient from "./api";

const getUpcomingBirthdays = (days = 90) => {
  console.log(`Fetching upcoming birthdays for the next ${days} days...`);
  return apiClient.get(`/upcoming-birthdays?days=${days}`);
};

export default {
  getUpcomingBirthdays,
};
