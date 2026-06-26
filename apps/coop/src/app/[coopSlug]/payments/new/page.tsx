"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const schema = z.object({
  bookingId: z.string(),
  method: z.string(),
  amount: z.string().refine((s) => !!toMoney(s), "Montant invalide"),
  proof: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function NewPaymentPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const currency = coop.currency ?? "MGA";

  const { data } = db.useQuery({
    bookings: { $: { where: { "cooperative.id": coopId } } },
  });
  const bookings = (data?.bookings ?? []).filter(notDeleted);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { bookingId: "none", method: "cash", amount: "", proof: "" },
  });
  const bookingId = watch("bookingId");
  const method = watch("method");

  const submit = handleSubmit(async (v) => {
    const amt = toMoney(v.amount);
    try {
      const tx = db.tx.payments[id()]
        .update({
          method: v.method,
          provider: "manual",
          amount: amt,
          currency,
          status: "paid",
          paidAt: Date.now(),
          proofUrl: v.proof || undefined,
          createdAt: Date.now(),
        })
        .link(
          v.bookingId !== "none"
            ? { cooperative: coopId, booking: v.bookingId }
            : { cooperative: coopId },
        );
      await db.transact(tx);
      toast.success("Paiement enregistré");
      router.push(`/${slug}/payments`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

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
            <Select value={bookingId} onValueChange={(v) => setValue("bookingId", v)}>
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
              <Select value={method} onValueChange={(v) => setValue("method", v)}>
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
            <Field label="Montant (MGA)" error={errors.amount?.message}>
              <Input inputMode="numeric" {...register("amount")} />
            </Field>
          </div>
          <Field label="URL justificatif (optionnel)">
            <Input {...register("proof")} placeholder="https://…" />
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
            {isSubmitting ? "…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
