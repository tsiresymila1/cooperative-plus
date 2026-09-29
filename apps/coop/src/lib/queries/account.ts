"use client";
import { useMutation } from "@tanstack/react-query";
import { api, authenticatedHeaders } from "@/lib/http/client";
import type {
  CreateAssistantInput,
  DeleteAssistantInput,
  UpdateAssistantInput,
} from "@/lib/http/services/accounts";

async function unwrap<T>(res: Response, data: T): Promise<T> {
  if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Échec");
  return data;
}

/** Create an assistant account (email+password) via the Hono RPC endpoint. */
export function useCreateAssistant() {
  return useMutation({
    mutationFn: async (input: CreateAssistantInput) => {
      const res = await api.team.assistant.$post(
        { json: input },
        { headers: authenticatedHeaders },
      );
      return unwrap(res, await res.json());
    },
  });
}

/** Update an assistant's status or permissions through the owner-authorized API. */
export function useUpdateAssistant() {
  return useMutation({
    mutationFn: async (input: UpdateAssistantInput) => {
      const res = await api.team.assistant.$patch(
        { json: input },
        { headers: authenticatedHeaders },
      );
      return unwrap(res, await res.json());
    },
  });
}

/** Remove an assistant membership through the owner-authorized API. */
export function useDeleteAssistant() {
  return useMutation({
    mutationFn: async (input: DeleteAssistantInput) => {
      const res = await api.team.assistant.$delete(
        { json: input },
        { headers: authenticatedHeaders },
      );
      return unwrap(res, await res.json());
    },
  });
}
