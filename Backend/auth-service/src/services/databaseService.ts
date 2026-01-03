import dotenv from "dotenv";
import { ConflictError } from "../utils/errors.js";

dotenv.config();

const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL;

export type User = {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  universityYear: number;
  phone: string;
  universityName: string;
  role: "admin" | "normal";
  createdAt?: Date;
  updatedAt?: Date;
};

async function callDatabaseService(api: string, data: any): Promise<any> {
  try {
    const response = await fetch(`${DATABASE_SERVICE_URL}/database`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api,
        data: {
          collection: "users",
          params: data,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Database service error: ${response.statusText}`);
    }

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

export async function createUser(
  user: Omit<User, "_id" | "createdAt" | "updatedAt">
): Promise<User> {
  const existingUser = await getUserByEmail(user.email);
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }
  const userData = {
    query: {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const result = await callDatabaseService("SET_DATA", userData);
  return {
    ...userData.query,
    _id: result.data.documentId || result.data.document?._id,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await callDatabaseService("GET_DATA", {
    query: { email },
  });

  if (!result.data || result.data.length === 0) {
    return null;
  }

  return result.data[0] as User;
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await callDatabaseService("GET_DATA", {
    query: { _id: userId },
  });

  if (!result.data || result.data.length === 0) {
    return null;
  }

  return result.data[0] as User;
}

export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  await callDatabaseService("UPDATE_DATA", {
    query: { _id: userId },
    update: {
      ...updates,
      updatedAt: new Date(),
    },
  });
}
