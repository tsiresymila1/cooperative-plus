import Hero from "@/components/sections/Hero";
import Destinations from "@/components/sections/Destinations";
import WhatYouGet from "@/components/sections/WhatYouGet";
import Benefits from "@/components/sections/Benefits";
import Counters from "@/components/sections/Counters";
import Schedule from "@/components/sections/Schedule";
import BusTravel from "@/components/sections/BusTravel";
import TransportTrust from "@/components/sections/TransportTrust";
import Faq from "@/components/sections/Faq";
import { HomeMotion } from "@/components/home-motion";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Réservez votre taxi-brousse à Madagascar",
  description:
    "Comparez les horaires des coopératives, choisissez votre siège et réservez votre trajet en taxi-brousse partout à Madagascar.",
  path: "/",
});

export default function Home() {
  return (
    <main>
      <HomeMotion />
      <Hero />
      <div>
        <Destinations />
      </div>
      <div>
        <WhatYouGet />
      </div>
      <div>
        <Benefits />
      </div>
      <div>
        <Counters />
      </div>
      <div>
        <Schedule />
      </div>
      <div>
        <BusTravel />
      </div>
      <div>
        <TransportTrust />
      </div>
      <div>
        <Faq />
      </div>
    </main>
  );
}
