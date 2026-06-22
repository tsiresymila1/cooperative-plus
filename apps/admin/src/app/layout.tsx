import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@cp/ui";
import { Toaster } from "@cp/ui";
import { themeScript } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Cooperative Plus — Administration",
  description: "Console plateforme.",
};
export const viewport: Viewport = { themeColor: "#0d1018" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
