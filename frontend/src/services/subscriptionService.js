import apiClient from "./api";

const subscribe = async (email) => {
  console.log(`Submitting subscription for ${email} via API...`);
  try {
    const response = await apiClient.post("/subscribe", { email });
    return response.data;
  } catch (error) {
    console.error(
      "Subscription API call failed:",
      error.response || error.message,
    );
    throw error;
  }
};

export default {
  subscribe,
};
