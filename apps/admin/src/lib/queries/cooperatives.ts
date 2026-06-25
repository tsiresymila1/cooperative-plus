"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/http/client";
import type { CreateCoopInput, CreateCoopAccountInput } from "@/lib/http/services/cooperatives";

async function unwrap<T>(res: Response, data: T): Promise<T> {
  if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Échec");
  return data;
}

/** Create a cooperative (+ optional owner) via the Hono RPC endpoint. */
export function useCreateCooperative() {
  return useMutation({
    mutationFn: async (input: CreateCoopInput) => {
      const res = await api.cooperatives.$post({ json: input });
      return unwrap(res, await res.json());
    },
  });
}

/** Attach an owner/assistant account to a cooperative. */
export function useCreateCoopAccount() {
  return useMutation({
    mutationFn: async (input: CreateCoopAccountInput) => {
      const res = await api.cooperatives.account.$post({ json: input });
      return unwrap(res, await res.json());
    },
  });
}

/** Wipe a cooperative's operational data (fresh reset). */
export function usePurgeCooperative() {
  return useMutation({
    mutationFn: async (coopId: string) => {
      const res = await api.cooperatives.purge.$post({ json: { coopId } });
      return unwrap(res, await res.json());
    },
  });
}

/** Permanently delete a cooperative + accounts + data. */
export function useDeleteCooperative() {
  return useMutation({
    mutationFn: async (coopId: string) => {
      const res = await api.cooperatives.delete.$post({ json: { coopId } });
      return unwrap(res, await res.json());
    },
  });
}
