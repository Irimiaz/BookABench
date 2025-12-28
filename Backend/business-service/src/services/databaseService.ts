import dotenv from "dotenv";

dotenv.config();

const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL;

if (!DATABASE_SERVICE_URL) {
  throw new Error("DATABASE_SERVICE_URL environment variable is not set");
}

export async function callDatabaseService(
  api: string,
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

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to communicate with database service");
  }
}
