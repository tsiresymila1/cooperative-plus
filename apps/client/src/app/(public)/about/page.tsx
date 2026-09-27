import PageBanner from "@/components/site/PageBanner";
import WhatYouGet from "@/components/sections/WhatYouGet";
import Counters from "@/components/sections/Counters";
import Benefits from "@/components/sections/Benefits";
import Testimonials from "@/components/sections/Testimonials";
import AppPromo from "@/components/sections/AppPromo";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "À propos",
  description:
    "Découvrez comment Coopérative Plus simplifie la réservation de taxi-brousse et relie les voyageurs aux coopératives de transport à Madagascar.",
  path: "/about",
});

/* Template About layout: banner, then the homepage what-you-get / counters /
   benefits blocks (benefits in split layout), testimonials and app promo. */
export default function AboutPage() {
  return (
    <main>
      <PageBanner
        title="À propos"
        image="/wp-content/uploads/2025/02/SLIDE_01.jpg?v=7"
      />
      <WhatYouGet
        image="/wp-content/uploads/2025/05/about_img-808x1024.jpg?v=2"
        padding="py-[100px] lg:py-[68px]"
      />
      <Counters />
      <Benefits
        layout="split"
        title={
          <>
            <span className="text-gold">
              Des sièges confortables et des services
            </span>{" "}
            pour un voyage agréable à travers Madagascar
          </>
        }
      />
      <Testimonials />
      <AppPromo />
    </main>
  );
}
