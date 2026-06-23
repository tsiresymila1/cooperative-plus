"use client";
import { PageSkeleton } from "@cp/ui";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
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
  toMoney,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

export default function RefundPaymentPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const paymentId = params.id;

  const { data, isLoading } = db.useQuery({
    payments: { $: { where: { id: paymentId, "cooperative.id": coopId } } },
  });
  const payment = data?.payments?.[0];

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!payment) return;
    const amt = amount ? toMoney(amount) : payment.amount;
    if (!amt) {
      toast.error("Montant invalide");
      return;
    }
    const full = amt >= payment.amount;
    setSaving(true);
    try {
      await db.transact([
        db.tx.refunds[id()]
          .update({
            amount: amt,
            reason: reason || undefined,
            status: "succeeded",
            createdAt: Date.now(),
          })
          .link({ payment: payment.id, cooperative: coopId }),
        db.tx.payments[payment.id].update({
          status: full ? "refunded" : "partially_refunded",
        }),
      ]);
      toast.success("Remboursement émis");
      router.push(`/${slug}/payments`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "payments", { role, permissions, isPlatformAdmin })}
      title="Rembourser"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Paiements</span>
          <ChevronRight size={12} />
          <span className="text-ink">Remboursement</span>
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
      {isLoading ? (
        <PageSkeleton />
      ) : !payment ? (
        <p className="text-ink-soft">Paiement introuvable.</p>
      ) : (
        <div className="mx-auto max-w-4xl">
          <FormSection index="01" title="Remboursement" description={`Paiement de ${fmtMoney(payment.amount)}. Laissez le montant vide pour rembourser la totalité.`}>
          <div className="grid gap-4">
            <Field
              label="Montant (MGA)"
              hint={`Laissez vide pour rembourser la totalité (${fmtMoney(payment.amount)})`}
            >
              <Input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={String(payment.amount)}
              />
            </Field>
            <Field label="Motif (optionnel)">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
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
              {saving ? "…" : "Rembourser"}
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
