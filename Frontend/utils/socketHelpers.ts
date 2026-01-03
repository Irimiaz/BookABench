import {
  socketClient,
  type DatabaseChangeMessage,
  type SubscriptionData,
  type SubscriptionUpdate,
} from "../api/socketClient";

// ==================== SOCKET CONNECTION HELPERS ====================

/**
 * Connect to the socket server
 * @returns The socket instance
 */
export function connectSocket() {
  return socketClient.connect();
}

/**
 * Disconnect from the socket server
 */
export function disconnectSocket() {
  socketClient.disconnect();
}

/**
 * Check if socket is connected
 * @returns true if connected, false otherwise
 */
export function isSocketConnected(): boolean {
  return socketClient.getIsConnected();
}

/**
 * Get the socket instance
 * @returns Socket instance or null
 */
export function getSocket() {
  return socketClient.getSocket();
}

// ==================== SOCKET SUBSCRIPTION HELPERS ====================

/**
 * Subscribe to database changes
 * @param userId - User ID from login
 * @param collections - Array of collection names to subscribe to (empty array = all collections)
 */
export function subscribeToChanges(
  userId: string,
  collections?: string[]
): void {
  socketClient.subscribe({ userId, collections });
}

/**
 * Update subscription preferences
 * @param collections - New collections to subscribe to
 * @param filters - Optional filters per collection
 */
export function updateSubscription(
  collections?: string[],
  filters?: Record<string, any>
): void {
  socketClient.updateSubscription({ collections, filters });
}

// ==================== SOCKET EVENT LISTENERS ====================

/**
 * Listen for subscription confirmation
 * @param callback - Callback function when subscription is confirmed
 * @returns Cleanup function to remove the listener
 */
export function onSubscribed(
  callback: (data: {
    success: boolean;
    message?: string;
    collections?: string[] | string;
  }) => void
): () => void {
  socketClient.onSubscribed(callback);
  return () => socketClient.off("subscribed", callback);
}

/**
 * Listen for subscription update confirmation
 * @param callback - Callback function when subscription is updated
 * @returns Cleanup function to remove the listener
 */
export function onSubscriptionUpdated(
  callback: (data: { success: boolean }) => void
): () => void {
  socketClient.onSubscriptionUpdated(callback);
  return () => socketClient.off("subscription_updated", callback);
}

/**
 * Listen for database changes
 * @param callback - Callback function when database changes occur
 * @returns Cleanup function to remove the listener
 */
export function onDatabaseChange(
  callback: (message: DatabaseChangeMessage) => void
): () => void {
  socketClient.onDatabaseChange(callback);
  return () => socketClient.off("database_change", callback);
}

// ==================== CONVENIENCE FUNCTIONS ====================

/**
 * Setup complete socket connection with subscription
 * @param userId - User ID from login
 * @param collections - Collections to subscribe to (optional, empty = all)
 * @param onChange - Callback for database changes
 * @returns Cleanup function to disconnect and remove listeners
 */
export function setupSocketConnection(
  userId: string,
  collections: string[] = [],
  onChange?: (message: DatabaseChangeMessage) => void
): () => void {
  // Connect
  const socket = connectSocket();

  // Subscribe when connected
  socket.on("connect", () => {
    subscribeToChanges(userId, collections);
  });

  // Setup listeners
  const cleanupFunctions: (() => void)[] = [];

  if (onChange) {
    const cleanup = onDatabaseChange(onChange);
    cleanupFunctions.push(cleanup);
  }

  // Return cleanup function
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
    disconnectSocket();
  };
}
