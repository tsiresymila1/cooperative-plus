"use client";
import { useEffect, useState } from "react";
import { toast } from "@cp/ui";
import { db } from "@cp/ui";

const inputCls = "h-11 w-full border border-navy/12 bg-white px-3.5 text-[15px] text-navy outline-none transition-colors placeholder:text-navy/40 focus:border-gold";

export default function Profile() {
  const { user } = db.useAuth();
  const { data } = db.useQuery(user ? { $users: { $: { where: { id: user.id } } } } : null);
  const me = data?.$users?.[0];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) { setName((me.name as string) ?? ""); setPhone((me.phone as string) ?? ""); }
  }, [me?.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try { await db.transact(db.tx.$users[user.id].update({ name, phone })); toast.success("Profil enregistré"); }
    finally { setSaving(false); }
  };

  const initials = (name || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="reveal max-w-xl space-y-6">
      <h1 className="font-display text-2xl font-bold uppercase">Profil</h1>
      <div className="border border-navy/10 bg-white p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-navy text-xl font-bold text-white">{initials}</div>
          <div><p className="font-display text-lg font-bold uppercase">{name || "Sans nom"}</p><p className="text-sm text-navy/60">{user?.email}</p></div>
        </div>
        <form className="space-y-4" onSubmit={save}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy">Nom complet</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy">Téléphone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="034 00 000 00" inputMode="tel" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy">Email</span>
            <input value={user?.email ?? ""} disabled className={`${inputCls} opacity-60`} />
          </label>
          <button disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 bg-gold px-5 font-display uppercase tracking-wide text-navy transition-colors hover:bg-navy hover:text-white disabled:opacity-50 disabled:hover:bg-gold disabled:hover:text-navy">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
