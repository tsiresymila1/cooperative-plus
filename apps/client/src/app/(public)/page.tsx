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
      <div className="reveal">
        <Destinations />
      </div>
      <div className="reveal">
        <WhatYouGet />
      </div>
      <div className="reveal">
        <Benefits />
      </div>
      <div className="reveal">
        <Counters />
      </div>
      <div className="reveal">
        <Schedule />
      </div>
      <div className="reveal">
        <BusTravel />
      </div>
      <div className="reveal">
        <TransportTrust />
      </div>
      <div className="reveal">
        <Faq />
      </div>
    </main>
  );
}
