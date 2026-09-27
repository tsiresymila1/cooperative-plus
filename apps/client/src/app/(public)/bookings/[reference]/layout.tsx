import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Détail de la réservation",
  description: "Consultez votre réservation Coopérative Plus.",
  path: "/bookings",
  noIndex: true,
});

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
