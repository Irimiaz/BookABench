import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { User } from "../utils/apiHelpers";

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for user data
const USER_STORAGE_KEY = "user_data";

// Helper functions for storage (works in web environment)
const getUserFromStorage = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveUserToStorage = (user: User | null): void => {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to save user to storage:", error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from sessionStorage (per-tab storage)
  const [user, setUserState] = useState<User | null>(() => {
    return getUserFromStorage();
  });

  // Update storage whenever user changes
  useEffect(() => {
    saveUserToStorage(user);
  }, [user]);

  const isAdmin = user?.role === "admin";

  // Wrapper for setUser that also updates storage
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    saveUserToStorage(newUser);
  };

  const logout = () => {
    setUserState(null);
    saveUserToStorage(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
