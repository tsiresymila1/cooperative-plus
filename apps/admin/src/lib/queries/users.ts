"use client";
import { useMutation } from "@tanstack/react-query";
import { api, authenticatedHeaders } from "@/lib/http/client";

/** Delete a user (server-side: credentials, memberships, $users row). */
export function useDeleteUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.users.delete.$post({ json: { userId } }, { headers: authenticatedHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Échec");
      return data;
    },
  });
}
