"use client";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { DashboardShell, coopNav, useCoop, db } from "@cp/ui";
import { BoardingScanner } from "@/components/boarding-scanner";

export default function ScanPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const tripId = useSearchParams().get("trip") ?? "";
  const { data } = db.useQuery(tripId ? { tripInstances: { $: { where: { id: tripId } } } } : null);
  const scopedTrip: any = data?.tripInstances?.[0];

  return (
    <DashboardShell
      nav={coopNav(slug, "scan", { role, permissions, isPlatformAdmin })}
      title="Embarquement"
      subtitle={scopedTrip
        ? `Trajet ${scopedTrip.originName} → ${scopedTrip.destName} · seuls ses billets sont acceptés.`
        : "Scannez le QR code du billet à l'embarquement."}
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><ChevronRight size={12} /><span className="text-ink">Embarquement</span></>}
    >
      <div className="mx-auto max-w-4xl">
        <BoardingScanner coopId={coopId} tripId={tripId} />
        <p className="mt-4 text-center text-xs text-ink-soft/50">
          Le pointage est aussi modifiable depuis chaque réservation.
        </p>
      </div>
    </DashboardShell>
  );
}
