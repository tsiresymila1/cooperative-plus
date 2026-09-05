import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import GoTop from "@/components/site/GoTop";
import { AccountNav } from "@/components/account-nav";
import { AuthGate } from "@cp/ui";

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
