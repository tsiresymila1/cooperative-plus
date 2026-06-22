import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@cp/ui";
import { Toaster } from "@cp/ui";

export const metadata: Metadata = {
  title: "Cooperative Plus — Réservez votre taxi-brousse",
  description: "Recherchez, réservez et payez vos trajets taxi-brousse à travers Madagascar.",
};
export const viewport: Viewport = { themeColor: "#16266b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
