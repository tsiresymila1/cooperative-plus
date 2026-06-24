"use client";
import { useEffect, useState } from "react";
import { Button, Card } from "@cp/ui";
import { Field, Input } from "@cp/ui";
import { toast } from "@cp/ui";
import { db } from "@cp/ui";

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
      <h1 className="font-display text-2xl font-bold">Profil</h1>
      <Card className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-strong text-xl font-bold text-white">{initials}</div>
          <div><p className="font-display text-lg font-bold">{name || "Sans nom"}</p><p className="text-sm text-ink-soft">{user?.email}</p></div>
        </div>
        <form className="space-y-4" onSubmit={save}>
          <Field label="Nom complet"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" /></Field>
          <Field label="Téléphone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="034 00 000 00" inputMode="tel" /></Field>
          <Field label="Email"><Input value={user?.email ?? ""} disabled className="opacity-60" /></Field>
          <Button disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
        </form>
      </Card>
    </div>
  );
}
