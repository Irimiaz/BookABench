import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";

const BACKEND_URL = Constants.expoConfig.extra.BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    "BACKEND_URL environment variable is not set for socket client"
  );
}

export type DatabaseChangeMessage = {
  type: "database_change";
  timestamp: string;
  operation: "SET_DATA" | "UPDATE_DATA" | "DELETE_DATA";
  collection: string;
  documentId: string;
  data?: any;
};

export type SubscriptionData = {
  userId: string;
  collections?: string[];
};

export type SubscriptionUpdate = {
  collections?: string[];
  filters?: Record<string, any>;
};

class SocketClient {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(BACKEND_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("[Socket] Connected:", this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("[Socket] Max reconnection attempts reached");
      }
    });

    return this.socket;
  }

  subscribe(data: SubscriptionData): void {
    if (!this.socket?.connected) {
      console.warn("[Socket] Not connected. Call connect() first.");
      return;
    }

    this.socket.emit("subscribe", {
      userId: data.userId,
      collections: data.collections || [],
    });
  }

  updateSubscription(data: SubscriptionUpdate): void {
    if (!this.socket?.connected) {
      console.warn("[Socket] Not connected. Call connect() first.");
      return;
    }

    this.socket.emit("update_subscription", data);
  }

  onSubscribed(
    callback: (data: {
      success: boolean;
      message?: string;
      collections?: string[] | string;
    }) => void
  ): void {
    this.socket?.on("subscribed", callback);
  }

  onSubscriptionUpdated(callback: (data: { success: boolean }) => void): void {
    this.socket?.on("subscription_updated", callback);
  }

  onDatabaseChange(callback: (message: DatabaseChangeMessage) => void): void {
    this.socket?.on("database_change", callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getIsConnected(): boolean {
    return this.isConnected && (this.socket?.connected || false);
  }
}

// Singleton instance
export const socketClient = new SocketClient();
