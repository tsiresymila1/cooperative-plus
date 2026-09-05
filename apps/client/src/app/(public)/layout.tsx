import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import GoTop from "@/components/site/GoTop";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <GoTop />
    </div>
  );
}
