import type { Metadata, Viewport } from "next";
import {  Bricolage_Grotesque, Spline_Sans_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@cp/ui";
import { Toaster } from "@cp/ui";
import { QueryProvider } from "@/components/query-provider";
import { Progress } from "@/components/progress";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans-next", display: "swap", weight: ["400", "500", "600", "700", "800", "900"] });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display-next", display: "swap" });
const mono = Spline_Sans_Mono({ subsets: ["latin"], variable: "--font-mono-next", display: "swap" });

export const metadata: Metadata = {
  title: "Cooperative Plus — Espace coopérative",
  description: "Tableau de bord coopérative.",
};
export const viewport: Viewport = { themeColor: "#0f2d5c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{if(localStorage.getItem('cp-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})();" }} />
        <QueryProvider><Providers><Progress>{children}</Progress></Providers></QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
