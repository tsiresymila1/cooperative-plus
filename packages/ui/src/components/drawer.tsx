"use client";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

/** Right-hand slide-over panel (Level 3) with a blurred backdrop. */
export function Drawer({ open, onClose, eyebrow, title, children, footer, width = "max-w-md" }: {
  open: boolean; onClose: () => void; eyebrow?: React.ReactNode; title: React.ReactNode;
  children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`absolute right-0 top-0 flex h-full w-full ${width} flex-col border-l border-ink/10 bg-paper shadow-[0_8px_24px_-8px_rgba(15,23,42,.14)]`}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-ink/8 px-6 py-5">
              <div className="min-w-0">
                {eyebrow && <p className="font-mono text-xs font-semibold text-ink-soft/70">{eyebrow}</p>}
                <h2 className="truncate font-display text-xl font-extrabold text-ink">{title}</h2>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink">
                <X size={18} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-ink/8 px-6 py-4">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
