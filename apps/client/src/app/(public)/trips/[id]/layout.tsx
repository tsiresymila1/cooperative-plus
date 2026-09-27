import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Détail du trajet",
  description: "Consultez les détails et les places disponibles pour ce trajet.",
  path: "/trips",
  noIndex: true,
});

export default function TripLayout({ children }: { children: React.ReactNode }) {
  return children;
}
