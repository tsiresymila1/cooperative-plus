"use client";

import { ChevronRight } from "lucide-react";
import { DashboardShell, FeedbackForm, coopNav, db, useCoop } from "@cp/ui";

const CLIENT_API = process.env.NEXT_PUBLIC_CLIENT_URL
  ?? (process.env.NODE_ENV === "production" ? "https://www.coop-plus.site" : "http://localhost:4000");

export default function CoopFeedbackPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin, userName } = useCoop();
  const { user } = db.useAuth();

  return (
    <DashboardShell
      nav={coopNav(slug, "feedback", { role, permissions, isPlatformAdmin })}
      title="Donner un feedback"
      subtitle="Signalez un problème ou proposez une amélioration à l’équipe Coopérative Plus."
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><ChevronRight size={12} /><span className="text-ink">Feedback</span></>}
    >
      <div className="mx-auto max-w-2xl">
        <FeedbackForm
          source="coop_web"
          apiBase={CLIENT_API}
          cooperativeId={coopId}
          defaultName={userName}
          defaultEmail={user?.email ?? ""}
        />
      </div>
    </DashboardShell>
  );
}
