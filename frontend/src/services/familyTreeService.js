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

const uploadPhoto = async (id, file) => {
  const form = new FormData();
  form.append("file", file);
  return (
    await apiClient.post(`/family/members/${id}/photo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;
};

const createInvite = async () => (await apiClient.post("/invites")).data;
const checkInvite = async (token) =>
  (await apiClient.get(`/invites/${token}`)).data;
const acceptInvite = async (token, username, password) =>
  (await apiClient.post(`/invites/${token}/accept`, { username, password }))
    .data;

export default {
  getFamilyTreeData,
  getChanges,
  createMember,
  updateMember,
  deleteMember,
  addRelation,
  removeRelation,
  uploadPhoto,
  createInvite,
  checkInvite,
  acceptInvite,
};
