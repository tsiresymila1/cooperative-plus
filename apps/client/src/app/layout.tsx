import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Barlow_Condensed, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@cp/ui";
import { Toaster } from "@cp/ui";
import { ScrollReveal } from "@/components/scroll-reveal";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans-next", display: "swap" });
const display = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display-next", display: "swap" });
const mono = Spline_Sans_Mono({ subsets: ["latin"], variable: "--font-mono-next", display: "swap" });

export const metadata: Metadata = {
  title: "Cooperative Plus — Réservez votre taxi-brousse",
  description: "Recherchez, réservez et payez vos trajets taxi-brousse à travers Madagascar.",
};
export const viewport: Viewport = { themeColor: "#14314C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{if(localStorage.getItem('cp-theme')!=='light')document.documentElement.classList.add('dark')}catch(e){}})();" }} />
        <ScrollReveal />
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
