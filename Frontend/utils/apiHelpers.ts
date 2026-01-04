import { apiClient } from "../api/client";

// ==================== AUTH HELPERS ====================

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  universityYear: number;
  phone: string;
  universityName: string;
  teacherID?: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type User = {
  _id: string;
  name: string;
  email: string;
  universityYear?: number;
  phone?: string;
  universityName?: string;
  role?: string;
};

export type AuthResponse = {
  user: User;
};

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiClient.request<AuthResponse>("REGISTER", "auth", data);
}

/**
 * Login with email and password
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  return apiClient.request<AuthResponse>("LOGIN", "auth", data);
}

// ==================== DATABASE HELPERS ====================

/**
 * Get data from a collection
 * @param collection - Collection name
 * @param query - Query object (empty object {} to get all documents)
 * @returns Array of documents
 */
export async function getData<T = any>(
  collection: string,
  query: any = {}
): Promise<T[]> {
  return apiClient.request<T[]>("GET_DATA", "database", {
    collection,
    params: { query },
  });
}

/**
 * Set data (insert new document or update if query matches)
 * @param collection - Collection name
 * @param query - Query object (document to insert/update)
 * @param update - Optional update object (if provided, updates existing document)
 * @returns Response with document or update result
 */
export async function setData<T = any>(
  collection: string,
  query: any,
  update?: any
): Promise<T> {
  console.log("[setData] Called with:", { collection, query, update });
  const params: any = { query };
  if (update && Object.keys(update).length > 0) {
    params.update = update;
  }
  console.log("[setData] Making API request with params:", params);
  try {
    const result = await apiClient.request<T>("SET_DATA", "database", {
      collection,
      params,
    });
    console.log("[setData] API request successful, result:", result);
    return result;
  } catch (error) {
    console.error("[setData] API request failed:", error);
    throw error;
  }
}

/**
 * Update existing data in a collection
 * @param collection - Collection name
 * @param query - Query to find the document(s) to update
 * @param update - Update object
 * @returns Update result with matchedCount and modifiedCount
 */
export async function modifyData(
  collection: string,
  query: any,
  update: any
): Promise<{ matchedCount: number; modifiedCount: number }> {
  return apiClient.request("UPDATE_DATA", "database", {
    collection,
    params: { query, update },
  });
}

/**
 * Delete data from a collection
 * @param collection - Collection name
 * @param query - Query to find the document(s) to delete
 * @returns Delete result with deletedCount
 */
export async function deleteData(
  collection: string,
  query: any
): Promise<{ deletedCount: number }> {
  return apiClient.request("DELETE_DATA", "database", {
    collection,
    params: { query },
  });
}
