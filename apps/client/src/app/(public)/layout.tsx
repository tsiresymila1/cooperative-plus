import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import GoTop from "@/components/site/GoTop";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <GoTop />
    </>
  );
}
