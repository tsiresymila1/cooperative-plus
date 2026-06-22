"use client";
import { create } from "zustand";
import { AnimatePresence, motion } from "motion/react";
import { Check, Info, X } from "lucide-react";

type Toast = { id: number; msg: string; tone: "success" | "error" | "info" };
type Store = { toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; dismiss: (id: number) => void };

export const useToast = create<Store>((set) => ({
  toasts: [],
  push: (t) => set((s) => {
    const id = s.toasts.length ? s.toasts[s.toasts.length - 1]!.id + 1 : 1;
    setTimeout(() => set((x) => ({ toasts: x.toasts.filter((y) => y.id !== id) })), 3500);
    return { toasts: [...s.toasts, { ...t, id }] };
  }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg: string) => useToast.getState().push({ msg, tone: "success" }),
  error: (msg: string) => useToast.getState().push({ msg, tone: "error" }),
  info: (msg: string) => useToast.getState().push({ msg, tone: "info" }),
};

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const icon = { success: <Check size={16} />, error: <X size={16} />, info: <Info size={16} /> };
  const tone = { success: "text-baobab", error: "text-danger", info: "text-sky" };
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[200] flex flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 24, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 24, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-3 rounded-[--radius] border border-ink/10 bg-paper px-4 py-3 text-sm shadow-[--shadow-lift]">
            <span className={tone[t.tone]}>{icon[t.tone]}</span>
            <span className="font-medium text-ink">{t.msg}</span>
            <button onClick={() => dismiss(t.id)} className="text-ink-soft/50 hover:text-ink"><X size={14} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
