import apiClient from "./api";

const getFamilyTreeData = async () =>
  (await apiClient.get("/family/tree")).data;
const getChanges = async (limit = 300) =>
  (await apiClient.get("/changes", { params: { limit } })).data;

const createMember = async (fields) =>
  (await apiClient.post("/family/members", fields)).data;
const updateMember = async (id, fields) =>
  (await apiClient.patch(`/family/members/${id}`, fields)).data;
const deleteMember = (id) => apiClient.delete(`/family/members/${id}`);

const addRelation = async (relation) =>
  (await apiClient.post("/family/relations", relation)).data;
const removeRelation = (id) => apiClient.delete(`/family/relations/${id}`);

export default {
  getFamilyTreeData,
  getChanges,
  createMember,
  updateMember,
  deleteMember,
  addRelation,
  removeRelation,
};
