"use client";
import { create } from "zustand";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui";

type Opts = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; tone?: "default" | "danger" };
type Req = Opts & { resolve: (v: boolean) => void };

const useStore = create<{ req: Req | null; open: (r: Req) => void; close: () => void }>((set) => ({
  req: null,
  open: (r) => set({ req: r }),
  close: () => set({ req: null }),
}));

/** const confirm = useConfirm(); if (await confirm({ title, message, tone:"danger" })) {...} */
export function useConfirm() {
  const open = useStore((s) => s.open);
  return (opts: Opts) => new Promise<boolean>((resolve) => open({ ...opts, resolve }));
}

/** Mounted once (in Providers). Renders a centered confirmation modal. */
export function ConfirmRoot() {
  const { req, close } = useStore();
  const done = (v: boolean) => { req?.resolve(v); close(); };
  return (
    <AnimatePresence>
      {req && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-5 backdrop-blur-sm"
          onClick={() => done(false)}>
          <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-ink/10 bg-paper p-6 text-center shadow-[0_10px_28px_-16px_rgba(15,23,42,.28)]">
            <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${req.tone === "danger" ? "bg-laterite/10 text-laterite" : "bg-ink/8 text-ink"}`}>
              <AlertTriangle size={22} />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">{req.title}</h2>
            {req.message && <p className="mt-1.5 text-sm text-ink-soft">{req.message}</p>}
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => done(false)}>{req.cancelLabel ?? "Annuler"}</Button>
              <Button variant={req.tone === "danger" ? "primary" : "ink"} size="sm" onClick={() => done(true)}>{req.confirmLabel ?? "Confirmer"}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
