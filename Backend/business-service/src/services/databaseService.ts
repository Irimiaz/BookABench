import dotenv from "dotenv";
import { getSocketService } from "./socketService";

dotenv.config();

const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL;

if (!DATABASE_SERVICE_URL) {
  throw new Error("DATABASE_SERVICE_URL environment variable is not set");
}

export async function callDatabaseService(
  api: "GET_DATA" | "SET_DATA" | "UPDATE_DATA" | "DELETE_DATA",
  collection: string,
  data: any
): Promise<any> {
  try {
    const response = await fetch(`${DATABASE_SERVICE_URL}/database`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api,
        data: {
          collection: collection,
          params: data,
        },
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Database service error");
    }

    if (api === "SET_DATA" || api === "UPDATE_DATA" || api === "DELETE_DATA") {
      notifyDatabaseChange(api, collection, result);
    }
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to communicate with database service");
  }
}

function notifyDatabaseChange(
  api: "SET_DATA" | "UPDATE_DATA" | "DELETE_DATA",
  collection: string,
  responseData: any
) {
  try {
    const socketService = getSocketService();
    socketService.notifyDatabaseChange({
      operation: api,
      collection,
      documentId: responseData.data.document._id || "NOT_FOUND",
      document: responseData.data.document || { _id: "NOT_FOUND" },
    });
  } catch (error) {
    // Silently fail if socket service is not available
    // This prevents breaking the main flow if sockets aren't initialized
    console.error("Failed to notify socket service:", error);
  }
}
