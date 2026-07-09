"use client";
import { PageSkeleton } from "@cp/ui";
import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  logActivity,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

export default function RefundPaymentPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin, userId } = useCoop();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const paymentId = params.id;

  const { data, isLoading } = db.useQuery({
    payments: { $: { where: { id: paymentId, "cooperative.id": coopId } } },
  });
  const payment = data?.payments?.[0];
  const maxAmount = payment?.amount ?? 0;

  const schema = useMemo(
    () =>
      z.object({
        amount: z
          .string()
          .optional()
          .superRefine((s, ctx) => {
            if (!s || !s.trim()) return; // empty = full refund
            const amt = toMoney(s);
            if (!amt || amt <= 0) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Montant invalide" });
              return;
            }
            if (amt > maxAmount) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Le montant ne peut pas dépasser ${fmtMoney(maxAmount)}`,
              });
            }
          }),
        reason: z.string().optional(),
      }),
    [maxAmount],
  );
  type Values = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { amount: "", reason: "" },
  });

  const submit = handleSubmit(async (v) => {
    if (!payment) return;
    const amt = v.amount && v.amount.trim() ? toMoney(v.amount) : payment.amount;
    const full = amt >= payment.amount;
    const refundId = id();
    try {
      await db.transact([
        db.tx.refunds[refundId]
          .update({
            amount: amt,
            reason: v.reason || undefined,
            status: "succeeded",
            createdAt: Date.now(),
          })
          .link({ payment: payment.id, cooperative: coopId }),
        db.tx.payments[payment.id].update({
          status: full ? "refunded" : "partially_refunded",
        }),
      ]);
      logActivity({ coopId, actorId: userId, action: "create", entityType: "refund", entityId: refundId, label: fmtMoney(amt) });
      toast.success("Remboursement émis");
      router.push(`/${slug}/payments`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

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
              error={errors.amount?.message}
            >
              <Input
                inputMode="numeric"
                {...register("amount")}
                placeholder={String(payment.amount)}
              />
            </Field>
            <Field label="Motif (optionnel)">
              <Input {...register("reason")} />
            </Field>
          </div>
          </FormSection>

          <div className="flex justify-end gap-2 pt-2">
            <Link href={`/${slug}/payments`}>
              <Button variant="outline" size="sm">
                Annuler
              </Button>
            </Link>
            <Button size="sm" onClick={submit} disabled={isSubmitting}>
              {isSubmitting ? "…" : "Rembourser"}
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
