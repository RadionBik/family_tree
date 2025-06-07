import apiClient from "./api";
import authService from "./authService";

const getAuthHeaders = () => {
  const token = authService.getToken();
  if (!token) {
    console.warn("No admin token found for API request.");
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

const getFamilyTreeData = async () => {
  console.log("Fetching public family tree data from API...");
  try {
    const response = await apiClient.get("/family/tree");
    return response.data;
  } catch (error) {
    console.error("Error fetching family tree data:", error);
    throw error;
  }
};

const getMembersAdmin = async (page = 1, size = 10, search = null) => {
  console.log(
    `Fetching paginated members for admin list: page=${page}, size=${size}, search='${search}'`,
  );
  try {
    const params = {
      page: page,
      size: size,
    };
    if (search) {
      params.search = search;
    }
    const response = await apiClient.get("/family/members/list", {
      headers: getAuthHeaders(),
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching members for admin:", error);
    throw error;
  }
};

const getMemberByIdAdmin = async (id) => {
  console.log(`Fetching member by ID for admin: ${id}`);
  try {
    const response = await apiClient.get(`/family/members/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching member ${id} for admin:`, error);
    throw error;
  }
};

const createMemberAdmin = async (memberData) => {
  console.log("Creating new member via admin API:", memberData);
  const apiData = {
    first_name: memberData.firstName,
    last_name: memberData.lastName,
    birth_date: memberData.birthDate || null,
    death_date: memberData.deathDate || null,
    gender: memberData.gender || null,
    location: memberData.location || null,
    notes: memberData.bio || null,
  };
  try {
    const response = await apiClient.post("/family/members", apiData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating member via admin API:", error);
    throw error;
  }
};

const updateMemberAdmin = async (id, memberData) => {
  console.log(`Updating member ${id} via admin API:`, memberData);
  const apiData = {
    first_name: memberData.firstName,
    last_name: memberData.lastName,
    birth_date: memberData.birthDate || null,
    death_date: memberData.deathDate || null,
    gender: memberData.gender || null,
    location: memberData.location || null,
    notes: memberData.bio || null,
  };

  try {
    const response = await apiClient.put(`/family/members/${id}`, apiData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating member ${id} via admin API:`, error);
    throw error;
  }
};

const deleteMemberAdmin = async (id) => {
  console.log(`Deleting member ${id} via admin API`);
  try {
    await apiClient.delete(`/family/members/${id}`, {
      headers: getAuthHeaders(),
    });
    return true;
  } catch (error) {
    console.error(`Error deleting member ${id} via admin API:`, error);
    throw error;
  }
};

const createRelationshipAdmin = async (
  fromMemberId,
  toMemberId,
  relationType,
  startDate = null,
  endDate = null,
) => {
  console.log(
    `Creating relationship: ${fromMemberId} -> ${toMemberId} (${relationType})`,
  );
  const apiData = {
    from_member_id: fromMemberId,
    to_member_id: toMemberId,
    relation_type: relationType,
    start_date: startDate || null,
    end_date: endDate || null,
  };
  try {
    const response = await apiClient.post("/family/relationships", apiData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating relationship via admin API:", error);
    throw error;
  }
};

const deleteRelationshipAdmin = async (relationId) => {
  console.log(`Deleting relationship ${relationId} via admin API`);
  try {
    await apiClient.delete(`/family/relationships/${relationId}`, {
      headers: getAuthHeaders(),
    });
    return true;
  } catch (error) {
    console.error(
      `Error deleting relationship ${relationId} via admin API:`,
      error,
    );
    throw error;
  }
};

const batchDeleteMembersAdmin = async (memberIds) => {
  console.log(`Batch deleting members via admin API: ${memberIds}`);
  try {
    const response = await apiClient.delete("/family/members/batch", {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      data: { member_ids: memberIds },
    });
    return response.data;
  } catch (error) {
    console.error("Error batch deleting members via admin API:", error);
    throw error;
  }
};

export default {
  getFamilyTreeData,
  getMembersAdmin,
  getMemberByIdAdmin,
  createMemberAdmin,
  updateMemberAdmin,
  deleteMemberAdmin,
  createRelationshipAdmin,
  deleteRelationshipAdmin,
  batchDeleteMembersAdmin,
};
