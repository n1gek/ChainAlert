"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./authContext";

export default function RootRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/home");
    else router.replace("/auth");
  }, [user, router]);

  // No UI here — immediate client-side redirect based on auth state
  return null;
}
