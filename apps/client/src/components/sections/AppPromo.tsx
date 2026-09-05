import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";

/* Closing block on /about-us. */

export default function AppPromo() {
  return (
    /* Source lays map-bg.png behind this block at 50% 50%. */
    <section
      className="bg-no-repeat py-[120px]"
      style={{
        backgroundImage: "url('/wp-content/uploads/2025/03/map-bg.png')",
        backgroundPosition: "50% 50%",
      }}
    >
      <div className="mx-auto max-w-shell px-[15px]">
        <div className="grid items-center gap-[60px] lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Application mobile"
              title={
                <>
                  Réservez vos trajets
                  <br />
                  plus vite avec l'app
                </>
              }
              className="mb-[26px]"
            />
            <p className="max-w-[520px] font-body text-[16px] font-light leading-[25.6px] text-navy/70">
              Recherchez une ligne, choisissez votre place et payez en quelques
              secondes. Retrouvez vos billets et vos QR codes d'embarquement
              directement dans votre poche, partout à Madagascar.
            </p>

            <div className="mt-[36px] flex flex-wrap gap-4">
              {["/wp-content/uploads/2025/03/app-2.png", "/wp-content/uploads/2025/03/app-3.png"].map(
                (src) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    width={200}
                    height={59}
                    className="h-[59px] w-[200px] object-contain"
                  />
                ),
              )}
            </div>
          </div>

          <div className="relative">
            <Image
              src="/wp-content/uploads/2025/03/app.png"
              alt=""
              width={322}
              height={653}
              sizes="322px"
              className="mx-auto h-[653px] w-[322px] object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
