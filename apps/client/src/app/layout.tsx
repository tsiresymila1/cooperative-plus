import type { Metadata, Viewport } from "next";
import { Montserrat, Bricolage_Grotesque, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@cp/ui";
import { Toaster } from "@cp/ui";

const sans = Montserrat({ subsets: ["latin"], variable: "--font-sans-next", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display-next", display: "swap" });
const mono = Spline_Sans_Mono({ subsets: ["latin"], variable: "--font-mono-next", display: "swap" });

export const metadata: Metadata = {
  title: "Cooperative Plus — Réservez votre taxi-brousse",
  description: "Recherchez, réservez et payez vos trajets taxi-brousse à travers Madagascar.",
};
export const viewport: Viewport = { themeColor: "#0f2d5c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{if(localStorage.getItem('cp-theme')!=='light')document.documentElement.classList.add('dark')}catch(e){}})();" }} />
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
