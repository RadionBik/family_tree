import apiClient from "./api";

const getFamilyTreeData = async () => {
  const response = await apiClient.get("/family/tree");
  return response.data;
};

export default { getFamilyTreeData };
