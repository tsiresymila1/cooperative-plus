import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Barlow_Condensed, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers, Toaster } from "@cp/ui";
import { Progress } from "@/components/progress";
import { ScrollReveal } from "@/components/scroll-reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { cn } from "@/lib/utils";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  websiteStructuredData,
} from "@/lib/seo";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["200","300","400","500","600","700","800"], variable: "--font-plus-jakarta", display: "swap" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-barlow-condensed", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-outfit", display: "swap" });

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: "Taxi-brousse à Madagascar | Coopérative Plus",
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "travel",
  keywords: [
    "taxi-brousse Madagascar",
    "réservation taxi-brousse",
    "billet de bus Madagascar",
    "transport Madagascar",
    "horaires taxi-brousse",
    "coopérative de transport",
  ],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Taxi-brousse à Madagascar | Coopérative Plus",
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "fr_MG",
    type: "website",
    images: [
      {
        url: "/hero.png",
        width: 1376,
        height: 768,
        alt: "Un autocar sur la route avec Coopérative Plus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taxi-brousse à Madagascar | Coopérative Plus",
    description: DEFAULT_DESCRIPTION,
    images: ["/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  other: {
    "geo.region": "MG",
    "geo.placename": "Madagascar",
  },
};
export const viewport: Viewport = { themeColor: "#14314C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-MG" className={cn(plusJakarta.variable, barlowCondensed.variable, outfit.variable)}>
      <body className="antialiased">
        <JsonLd data={websiteStructuredData} />
        <ScrollReveal />
        <Progress>
          <Providers askConsentement>{children}</Providers>
        </Progress>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
