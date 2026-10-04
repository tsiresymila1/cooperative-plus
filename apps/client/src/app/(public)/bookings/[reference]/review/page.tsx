"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TripReviewForm, db } from "@cp/ui";

export default function BookingReviewPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = use(params);
  const { user } = db.useAuth();
  const { data } = db.useQuery(user && !(user as { isGuest?: boolean }).isGuest
    ? { $users: { $: { where: { id: user.id } } } }
    : null);
  const profile = data?.$users?.[0];

  return (
    <main className="bg-sand px-4 pb-16 pt-32 sm:pt-36">
      <div className="mx-auto max-w-2xl">
        <Link href={`/bookings/${reference}`} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-navy/65 hover:text-navy">
          <ArrowLeft size={16} /> Retour au billet
        </Link>
        <TripReviewForm
          key={user?.id ?? reference}
          bookingReference={reference}
          variant="site"
          defaultName={profile?.name ?? ""}
          defaultEmail={user && !(user as { isGuest?: boolean }).isGuest ? user.email ?? "" : ""}
        />
      </div>
    </main>
  );
}
