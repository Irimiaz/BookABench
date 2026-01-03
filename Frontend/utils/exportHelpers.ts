// Export all API helpers
export {
  register,
  login,
  getData,
  setData,
  modifyData,
  deleteData,
  type RegisterData,
  type LoginData,
  type User,
  type AuthResponse,
} from "./apiHelpers";

// Export all Socket helpers
export {
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  getSocket,
  subscribeToChanges,
  updateSubscription,
  onSubscribed,
  onSubscriptionUpdated,
  onDatabaseChange,
  setupSocketConnection,
} from "./socketHelpers";

// Export types from socket client
export type {
  DatabaseChangeMessage,
  SubscriptionData,
  SubscriptionUpdate,
} from "../api/socketClient";
