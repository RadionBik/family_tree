import apiClient from "./api";
import authService from "./authService"; // Import authService to get the token

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = authService.getToken();
  if (!token) {
    console.warn("No admin token found for API request.");
    // Optionally throw an error or let the API call fail with 401
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

const getFamilyTreeData = async () => {
  console.log("Fetching public family tree data from API...");
  try {
    const response = await apiClient.get("/family/tree"); // Use the correct endpoint
    return response.data; // Return the actual data from the response
  } catch (error) {
    console.error("Error fetching family tree data:", error);
    // Re-throw the error or return a specific error structure
    throw error;
  }
};

// --- Admin CRUD Operations ---

// Get paginated members list for admin, with optional search
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
      params.search = search; // Add search term if provided
    }
    const response = await apiClient.get("/family/members/list", {
      headers: getAuthHeaders(),
      params: params, // Send params object
    });
    // The response should now be the PaginatedFamilyMembersResponse object
    return response.data;
  } catch (error) {
    console.error("Error fetching members for admin:", error);
    throw error;
  }
};

// Get a single member by ID
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

// Create a new member
const createMemberAdmin = async (memberData) => {
  console.log("Creating new member via admin API:", memberData);
  // Map frontend form data (firstName, lastName, middleName, bio)
  // to backend schema (first_name, last_name, middle_name, notes)
  const apiData = {
    first_name: memberData.firstName,
    last_name: memberData.lastName,
    middle_name: memberData.middleName || null, // Ensure null if empty
    birth_date: memberData.birthDate || null,
    death_date: memberData.deathDate || null,
    gender: memberData.gender || null,
    location: memberData.location || null,
    notes: memberData.bio || null, // Map bio to notes
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

// Update an existing member
const updateMemberAdmin = async (id, memberData) => {
  console.log(`Updating member ${id} via admin API:`, memberData);
  // Map frontend form data to backend schema
  const apiData = {
    first_name: memberData.firstName,
    last_name: memberData.lastName,
    middle_name: memberData.middleName || null,
    birth_date: memberData.birthDate || null,
    death_date: memberData.deathDate || null,
    gender: memberData.gender || null,
    location: memberData.location || null,
    notes: memberData.bio || null, // Map bio to notes
  };
  // Filter out null/undefined values if the backend expects only provided fields for PATCH
  // For PUT, we might send all fields. Assuming PUT for now based on API definition.
  // const filteredApiData = Object.fromEntries(Object.entries(apiData).filter(([_, v]) => v !== null && v !== undefined));

  try {
    const response = await apiClient.put(`/family/members/${id}`, apiData, {
      // Use apiData directly for PUT
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating member ${id} via admin API:`, error);
    throw error;
  }
};

// Delete a member
const deleteMemberAdmin = async (id) => {
  console.log(`Deleting member ${id} via admin API`);
  try {
    // DELETE requests typically don't return content, status code indicates success
    await apiClient.delete(`/family/members/${id}`, {
      headers: getAuthHeaders(),
    });
    return true; // Indicate success
  } catch (error) {
    console.error(`Error deleting member ${id} via admin API:`, error);
    throw error;
  }
};

// --- Admin Relationship Operations ---

// Create a new relationship
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
    from_member_id: parseInt(fromMemberId, 10), // Ensure IDs are numbers
    to_member_id: parseInt(toMemberId, 10),
    relation_type: relationType, // e.g., 'parent', 'spouse'
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

// Delete a relationship
const deleteRelationshipAdmin = async (relationId) => {
  console.log(`Deleting relationship ${relationId} via admin API`);
  try {
    await apiClient.delete(`/family/relationships/${relationId}`, {
      headers: getAuthHeaders(),
    });
    return true; // Indicate success
  } catch (error) {
    console.error(
      `Error deleting relationship ${relationId} via admin API:`,
      error,
    );
    throw error;
  }
};

// Note: Fetching relationships is usually done via getMemberByIdAdmin

// Batch delete members
const batchDeleteMembersAdmin = async (memberIds) => {
  console.log(`Batch deleting members via admin API: ${memberIds}`);
  try {
    const response = await apiClient.delete("/family/members/batch", {
      headers: {
        ...getAuthHeaders(), // Include auth token
        "Content-Type": "application/json", // Specify content type for body
      },
      data: { member_ids: memberIds }, // Send IDs in the request body
    });
    // Return response data which might include deleted count or message
    return response.data;
  } catch (error) {
    console.error("Error batch deleting members via admin API:", error);
    throw error;
  }
};

// --- Export all service functions ---
export default {
  getFamilyTreeData, // Public endpoint
  // Admin member endpoints
  getMembersAdmin,
  getMemberByIdAdmin,
  createMemberAdmin,
  updateMemberAdmin,
  deleteMemberAdmin,
  // Admin relationship endpoints
  createRelationshipAdmin,
  deleteRelationshipAdmin,
  // Batch delete
  batchDeleteMembersAdmin,
};
