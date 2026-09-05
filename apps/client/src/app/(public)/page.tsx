import Hero from "@/components/sections/Hero";
import Destinations from "@/components/sections/Destinations";
import WhatYouGet from "@/components/sections/WhatYouGet";
import Benefits from "@/components/sections/Benefits";
import Counters from "@/components/sections/Counters";
import Schedule from "@/components/sections/Schedule";
import BusTravel from "@/components/sections/BusTravel";
import TransportTrust from "@/components/sections/TransportTrust";
import Faq from "@/components/sections/Faq";

export default function Home() {
  return (
    <main>
      <Hero />
      <Destinations />
      <WhatYouGet />
      <Benefits />
      <Counters />
      <Schedule />
      <BusTravel />
      <TransportTrust />
      <Faq />
    </main>
  );
}
