"use client";
import { useState } from "react";
import { ImageIcon, UploadCloud } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Image upload with live preview. Parent provides current `value` (url) and an
 * async `onFile` that does the actual storage upload + persistence.
 */
export function ImageUpload({ value, onFile, hint, className }: {
  value?: string | null; onFile: (file: File) => Promise<void> | void; hint?: string; className?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shown = preview ?? value;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file)); // instant local preview
    setBusy(true);
    try { await onFile(file); } finally { setBusy(false); }
  };

  return (
    <div className={cn("flex items-center gap-4 rounded-sm border border-dashed border-ink/15 bg-sand/40 p-4", className)}>
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink/10 bg-paper">
        {shown ? <img src={shown} alt="aperçu" className="h-full w-full object-cover" /> : <ImageIcon size={22} className="text-ink-soft/40" />}
      </div>
      <div className="min-w-0">
        <label className={cn("inline-flex h-9 cursor-pointer items-center gap-2 rounded-[--radius] border border-ink/15 bg-paper px-3 text-sm font-medium text-ink transition-colors hover:bg-ink/5", busy && "pointer-events-none opacity-60")}>
          <UploadCloud size={15} /> {busy ? "Envoi…" : shown ? "Remplacer le logo" : "Téléverser un logo"}
          <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={pick} disabled={busy} />
        </label>
        <p className="mt-1.5 text-xs text-ink-soft/70">{hint ?? "PNG, JPG, SVG ou WEBP — 1 Mo max."}</p>
      </div>
    </div>
  );
}
