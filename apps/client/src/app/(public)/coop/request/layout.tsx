import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Inscrire votre coopérative de transport",
  description:
    "Rejoignez Coopérative Plus pour gérer vos lignes, véhicules, horaires et réservations de taxi-brousse en ligne.",
  path: "/coop/request",
});

export default function CoopRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
