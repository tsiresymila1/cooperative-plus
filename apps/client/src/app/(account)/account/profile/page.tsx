"use client";
import { useEffect, useState } from "react";
import { toast } from "@cp/ui";
import { db } from "@cp/ui";

const inputCls = "h-[53px] w-full border border-navy/15 bg-white px-5 font-body text-navy outline-none transition-colors placeholder:text-navy/40 focus:border-gold";

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
    <div className="reveal max-w-xl space-y-8">
      <h1 className="font-display text-[40px] font-semibold uppercase leading-none tracking-[-1.5px] text-navy">
        Profil
      </h1>
      <div className="border border-navy/10 bg-white px-[26px] py-8">
        <div className="mb-8 flex items-center gap-5">
          <div className="grid h-16 w-16 place-items-center bg-navy font-display text-[24px] font-semibold uppercase text-white">{initials}</div>
          <div>
            <p className="font-display text-[24px] font-semibold uppercase leading-none text-navy">{name || "Sans nom"}</p>
            <p className="mt-2 font-body text-[14px] font-light text-navy/60">{user?.email}</p>
          </div>
        </div>
        <form className="space-y-5" onSubmit={save}>
          <label className="block">
            <span className="mb-2 block text-[14px] text-navy">Nom complet</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-2 block text-[14px] text-navy">Téléphone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="034 00 000 00" inputMode="tel" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-2 block text-[14px] text-navy">Email</span>
            <input value={user?.email ?? ""} disabled className={`${inputCls} opacity-60`} />
          </label>
          <button
            disabled={saving}
            className="inline-flex h-[70px] items-center justify-center px-6 font-display text-[16px] font-semibold uppercase tracking-[0.5px] transition-colors duration-[250ms] ease-out bg-gold text-navy hover:bg-navy hover:text-white disabled:opacity-50 disabled:hover:bg-gold disabled:hover:text-navy"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
