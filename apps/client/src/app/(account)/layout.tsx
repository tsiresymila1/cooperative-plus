import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import GoTop from "@/components/site/GoTop";
import { AccountNav } from "@/components/account-nav";
import { AuthGate } from "@cp/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Mon compte",
  description: "Gérez votre profil et vos réservations Coopérative Plus.",
  path: "/account/dashboard",
  noIndex: true,
});

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1 pt-[100px]">
        <div className="mx-auto max-w-content px-[15px] py-10 lg:py-14">
          <AuthGate>
            <AccountNav />
            <div className="mt-8">{children}</div>
          </AuthGate>
        </div>
      </main>
      <Footer />
      <GoTop />
    </div>
  );
}
