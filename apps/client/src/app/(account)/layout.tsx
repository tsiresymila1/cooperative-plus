import { SiteHeader } from "@/components/site-header";
import { AccountNav } from "@/components/account-nav";
import { AuthGate } from "@cp/ui";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-5 py-8">
        <AuthGate>
          <AccountNav />
          <div className="mt-6">{children}</div>
        </AuthGate>
      </div>
    </>
  );
}
