import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPSServer } from "https";

type UserSubscription = {
  userId: string;
  collections: string[];
  filters?: Record<string, any>; // Optional filters per collection
};

class SocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, UserSubscription> = new Map(); // socketId -> subscription

  constructor(server: HTTPServer | HTTPSServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ["*"],
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      allowEIO3: true,
      // Important for Docker/Portainer
      path: "/socket.io/",
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // User subscribes after login
      socket.on(
        "subscribe",
        (data: { userId: string; collections?: string[] }) => {
          const { userId, collections = [] } = data;

          this.userSockets.set(userId, socket.id);
          this.socketUsers.set(socket.id, {
            userId,
            collections: collections.length > 0 ? collections : [], // Empty = all collections
          });

          socket.join(`user:${userId}`);
          socket.emit("subscribed", {
            success: true,
            message: "Successfully subscribed to database changes",
            collections: collections.length > 0 ? collections : "all",
          });

          console.log(
            `User ${userId} subscribed to collections:`,
            collections.length > 0 ? collections : "all"
          );
        }
      );

      // User can update their subscription
      socket.on(
        "update_subscription",
        (data: { collections?: string[]; filters?: Record<string, any> }) => {
          const subscription = this.socketUsers.get(socket.id);
          if (subscription) {
            if (data.collections) subscription.collections = data.collections;
            if (data.filters) subscription.filters = data.filters;
            socket.emit("subscription_updated", { success: true });
          }
        }
      );

      socket.on("disconnect", () => {
        const subscription = this.socketUsers.get(socket.id);
        if (subscription) {
          this.userSockets.delete(subscription.userId);
          console.log(`User ${subscription.userId} disconnected`);
        }
        this.socketUsers.delete(socket.id);
      });
    });
  }

  // Called when database changes occur
  public notifyDatabaseChange(change: {
    operation: "SET_DATA" | "UPDATE_DATA" | "DELETE_DATA";
    collection: string;
    documentId: string;
    document?: any;
  }) {
    // Broadcast to all users subscribed to this collection
    this.socketUsers.forEach((subscription, socketId) => {
      const shouldNotify =
        subscription.collections.length === 0 || // Subscribed to all
        subscription.collections.includes(change.collection);

      if (shouldNotify) {
        // Apply filters if any
        if (subscription.filters && subscription.filters[change.collection]) {
          // You can add custom filtering logic here
          // For now, we'll send all changes
        }

        const message = {
          type: "database_change",
          timestamp: new Date().toISOString(),
          operation: change.operation, // Now uses API name: "SET_DATA", "UPDATE_DATA", or "DELETE_DATA"
          collection: change.collection,
          documentId: change.documentId,
          data: change.document,
        };

        this.io.to(socketId).emit("database_change", message);
      }
    });
  }

  public getIO() {
    return this.io;
  }
}

let socketServiceInstance: SocketService | null = null;

export function initializeSocketService(
  server: HTTPServer | HTTPSServer
): SocketService {
  if (!socketServiceInstance) {
    socketServiceInstance = new SocketService(server);
  }
  console.log("🔥 Socket service initialized");
  return socketServiceInstance;
}

export function getSocketService(): SocketService {
  if (!socketServiceInstance) {
    throw new Error(
      "Socket service not initialized. Call initializeSocketService first."
    );
  }
  return socketServiceInstance;
}
