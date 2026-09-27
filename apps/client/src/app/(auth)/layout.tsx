import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import GoTop from "@/components/site/GoTop";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Connexion",
  description: "Connectez-vous à votre compte Coopérative Plus.",
  path: "/sign-in",
  noIndex: true,
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <GoTop />
    </>
  );
}
