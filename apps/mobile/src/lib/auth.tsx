import { createContext, useContext, type ReactNode } from "react";
import { db } from "@/lib/db";
import type { User } from "@instantdb/react-native";

type AuthValue = {
  user: User | null;
  isLoading: boolean;
  error?: string;
};

const AuthContext = createContext<AuthValue>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoading, user, error } = db.useAuth();
  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, error: error?.message }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
