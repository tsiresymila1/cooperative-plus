"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../lib/db";
import { Spinner } from "./ui";

/** Gate client pages behind a real (non-guest) session. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = db.useAuth();
  const router = useRouter();
  const isGuest = (user as { isGuest?: boolean } | null)?.isGuest;

  useEffect(() => {
    if (!isLoading && (!user || isGuest)) router.replace("/sign-in");
  }, [isLoading, user, isGuest, router]);

  if (isLoading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (!user || isGuest) return null;
  return <>{children}</>;
}
