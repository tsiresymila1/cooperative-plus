"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Ticket, CreditCard } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  id,
  Button,
  FormSection,
  Field,
  toast,
  fmtMoney,
  notDeleted,
  toMoney,
} from "@cp/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
} from "@cp/ui/shadcn";

const METHODS = [
  { value: "cash", label: "Espèces" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "card", label: "Carte" },
  { value: "bank_transfer", label: "Virement" },
];

export default function NewPaymentPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const currency = coop.currency ?? "MGA";

  const { data } = db.useQuery({
    bookings: { $: { where: { "cooperative.id": coopId } } },
  });
  const bookings = (data?.bookings ?? []).filter(notDeleted);

  const [bookingId, setBookingId] = useState("none");
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [proof, setProof] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amt = toMoney(amount);
    if (!amt) {
      toast.error("Montant invalide");
      return;
    }
    setSaving(true);
    try {
      const tx = db.tx.payments[id()]
        .update({
          method,
          provider: "manual",
          amount: amt,
          currency,
          status: "paid",
          paidAt: Date.now(),
          proofUrl: proof || undefined,
          createdAt: Date.now(),
        })
        .link(
          bookingId !== "none"
            ? { cooperative: coopId, booking: bookingId }
            : { cooperative: coopId },
        );
      await db.transact(tx);
      toast.success("Paiement enregistré");
      router.push(`/${slug}/payments`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "payments", { role, permissions, isPlatformAdmin })}
      title="Enregistrer un paiement"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Paiements</span>
          <ChevronRight size={12} />
          <span className="text-ink">Nouveau</span>
        </>
      }
      action={
        <Link href={`/${slug}/payments`}>
          <Button size="sm" variant="outline">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>
      }
    >
      <div className="mx-auto max-w-4xl">
        <FormSection index="01" title="Paiement" description="Liez le paiement à une réservation et précisez la méthode et le montant.">
        <div className="grid gap-4">
          <Field label="Réservation (optionnel)">
            <Select value={bookingId} onValueChange={setBookingId}>
              <SelectTrigger>
                <span className="inline-flex items-center gap-2">
                  <Ticket size={15} className="text-ink-soft/60" />
                  <SelectValue placeholder="Aucune" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {bookings.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.reference} · {b.contactName} ({fmtMoney(b.totalAmount)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Méthode">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <span className="inline-flex items-center gap-2">
                    <CreditCard size={15} className="text-ink-soft/60" />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Montant (MGA)">
              <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          </div>
          <Field label="URL justificatif (optionnel)">
            <Input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="https://…" />
          </Field>
        </div>
        </FormSection>

        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/${slug}/payments`}>
            <Button variant="outline" size="sm">
              Annuler
            </Button>
          </Link>
          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? "…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
