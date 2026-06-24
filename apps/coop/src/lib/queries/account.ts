"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/http/client";
import type { CreateAssistantInput } from "@/lib/http/services/accounts";

/** Create an assistant account (email+password) via the Hono RPC endpoint. */
export function useCreateAssistant() {
  return useMutation({
    mutationFn: async (input: CreateAssistantInput) => {
      const res = await api.team.assistant.$post({ json: input });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Échec");
      return data;
    },
  });
}
