import dotenv from "dotenv";

dotenv.config();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

if (!AUTH_SERVICE_URL) {
  throw new Error("AUTH_SERVICE_URL environment variable is not set");
}

export async function callAuthService(api: string, data: any): Promise<any> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api,
        data: data,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Auth service error");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to communicate with auth service");
  }
}
