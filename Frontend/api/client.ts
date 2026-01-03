import axios, { AxiosInstance, AxiosError } from "axios";
import Constants from "expo-constants";

const BACKEND_URL = Constants.expoConfig.extra.BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    "BACKEND_URL environment variable is not set for normal client"
  );
}

export type Service = "auth" | "database";
export type AuthAPI = "REGISTER" | "LOGIN";
export type DatabaseAPI =
  | "GET_DATA"
  | "SET_DATA"
  | "UPDATE_DATA"
  | "DELETE_DATA";
export type API = AuthAPI | DatabaseAPI;

export type RequestPayload = {
  api: API;
  service: Service;
  data: any;
};

export type Response<T = any> =
  | {
      success: true;
      message?: string;
      data?: T;
    }
  | {
      success: false;
      message: string;
      stack?: string;
    };

export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BACKEND_URL,
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });

    // Interceptor: attach auth token if available
    this.client.interceptors.request.use((cfg) => {
      // const token = getAuthToken();
      // if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });
  }

  // Generic request method
  async request<T>(api: API, service: Service, data: any): Promise<T> {
    try {
      const { data: response } = await this.client.post<Response<T>>(
        "/business",
        {
          api,
          service,
          data,
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Request failed");
      }

      return response.data as T;
    } catch (err) {
      const error = err as AxiosError<Response>;
      if (error.response?.data) {
        throw new Error(error.response.data.message || "Request failed");
      }
      throw err as AxiosError;
    }
  }
}

// Singleton instance
export const apiClient = new ApiClient();
