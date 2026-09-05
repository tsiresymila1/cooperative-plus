import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Barlow_Condensed, Outfit } from "next/font/google";
import "./globals.css";
import { Providers, Toaster } from "@cp/ui";
import { Progress } from "@/components/progress";
import { ScrollReveal } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["200","300","400","500","600","700","800"], variable: "--font-plus-jakarta", display: "swap" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-barlow-condensed", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-outfit", display: "swap" });

export const metadata: Metadata = {
  title: "Coopérative Plus — Réservez votre taxi-brousse",
  description: "Recherchez, réservez et payez vos trajets taxi-brousse à travers Madagascar.",
};
export const viewport: Viewport = { themeColor: "#14314C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cn(plusJakarta.variable, barlowCondensed.variable, outfit.variable)}>
      <body className="antialiased">
        <ScrollReveal />
        <Progress>
          <Providers>{children}</Providers>
        </Progress>
        <Toaster />
      </body>
    </html>
  );
}
