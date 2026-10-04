"use client";

import { db, FeedbackForm } from "@cp/ui";

export function FeedbackPageClient() {
  const { user } = db.useAuth();
  const isReal = !!user && !(user as { isGuest?: boolean }).isGuest;
  const { data } = db.useQuery(isReal ? { $users: { $: { where: { id: user.id } } } } : null);
  const profile = data?.$users?.[0];

  return (
    <FeedbackForm
      key={user?.id ?? "guest"}
      source="client_web"
      variant="site"
      defaultName={profile?.name ?? ""}
      defaultEmail={isReal ? user.email ?? "" : ""}
    />
  );
}
