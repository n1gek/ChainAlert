"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./lib/firebase";

const AuthContext = createContext<{ user: User | null }>({ user: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setError("Firebase not initialized. Please check your environment variables.");
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, setUser);
      setLoading(false);
      return () => unsubscribe();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h2>Error</h2>
        <p>{error}</p>
        <p>Make sure NEXT_PUBLIC_FIREBASE_* environment variables are set in Vercel.</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
