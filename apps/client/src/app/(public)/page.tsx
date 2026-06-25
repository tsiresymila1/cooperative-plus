"use client";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bus,
  Clock3,
  MapPin,
  MousePointerClick,
  Quote,
  ShieldCheck,
  Star,
  Ticket,
} from "lucide-react";
import { Button, Logo, TagBadge, db, notDeleted, todayISO } from "@cp/ui";
import { SiteHeader } from "@/components/site-header";
import { SearchBar } from "@/components/search-bar";
import { fmtMoney } from "@cp/ui";

const HERO_IMG = "/hero.png";

const steps = [
  {
    icon: MapPin,
    title: "Cherchez",
    desc: "Départ, arrivée, date. Comparez 47 coopératives en un coup d'œil.",
  },
  {
    icon: MousePointerClick,
    title: "Choisissez votre siège",
    desc: "Plan du véhicule en temps réel. Siège maintenu 5 minutes.",
  },
  {
    icon: Ticket,
    title: "Payez & embarquez",
    desc: "Mobile Money, carte ou espèces. Billet QR instantané.",
  },
];
// ponytail: cosmetic category tabs (first active); wire to a vehicleType filter when search supports it.
const tabs = ["Tous", "Bus", "Minibus", "4×4"] as const;
const reviews = [
  {
    name: "Hanta R.",
    route: "Tana → Majunga",
    text: "Plus besoin de faire la queue à la gare routière. Siège choisi, payé par MVola, billet sur le téléphone. Parfait.",
  },
  {
    name: "Tojo A.",
    route: "Tana → Tamatave",
    text: "Le plan du bus en direct, c'est génial. J'ai pris ma place côté fenêtre à l'avance. Zéro stress.",
  },
  {
    name: "Mialy F.",
    route: "Antsirabe → Tuléar",
    text: "J'ai comparé 4 coopératives en 30 secondes. Prix clairs, départ confirmé. Je ne réserve plus autrement.",
  },
];

export default function Landing() {
  const today = todayISO();
  // Live data — upcoming scheduled trips + network counts.
  const { data } = db.useQuery({
    cooperatives: {},
    destinations: { $: { where: { isGlobal: true } } },
    tripInstances: {
      $: { where: { status: "scheduled", departDate: { $gte: today } } },
      tag: {},
    },
  });
  const coops = (data?.cooperatives ?? []).filter(notDeleted);
  const dests = (data?.destinations ?? []).filter(notDeleted);
  const trips = (data?.tripInstances ?? []).filter(notDeleted);

  const stats: readonly (readonly [string, string])[] = [
    [String(coops.length || "—"), "coopératives"],
    [String(trips.length || "—"), "trajets à venir"],
    [String(dests.length || "—"), "villes desservies"],
    ["4.8★", "note voyageurs"],
  ];

  // Popular routes = busiest origin→dest among upcoming trips.
  const popularRoutes = useMemo(() => {
    const map = new Map<
      string,
      {
        from: string;
        to: string;
        price: number;
        dur: string;
        coops: Set<string>;
        count: number;
        tags: Set<{ id: string; name: string; color?: string }>;
      }
    >();
    for (const t of (data?.tripInstances ?? []).filter(notDeleted) as any[]) {
      const key = `${t.originName}__${t.destName}`;
      let e = map.get(key);
      if (!e) {
        e = {
          from: t.originName,
          to: t.destName,
          price: t.price,
          dur: "",
          coops: new Set(),
          count: 0,
          tags: new Set(),
        };
        map.set(key, e);
      }
      e.count++;
      e.price = Math.min(e.price, t.price);
      if (t.coopName) e.coops.add(t.coopName);
      if (!e.dur && t.arrivalEstimateAt && t.departureAt) {
        const ms = +new Date(t.arrivalEstimateAt) - +new Date(t.departureAt);
        if (ms > 0) e.dur = `${Math.round(ms / 3.6e6)}h`;
      }
      if (t.tag && !Array.from(e.tags).some((x) => x.id === t.tag?.id)) {
        e.tags.add({
          id: t.tag.id,
          name: t.tag.name,
          color: t.tag.color,
        });
      }
    }
    return [...map.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((e) => ({
        from: e.from,
        to: e.to,
        price: e.price,
        dur: e.dur,
        coops: e.coops.size,
        tags: e.tags,
      }));
  }, [data]);

  return (
    <main className="relative">
      {/* ── Hero — full-screen image ─────────────────────────── */}
      <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
        {/* photo covers the whole viewport — optimized + cached via next/image */}
        <Image
          src={HERO_IMG}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 scale-105 object-cover blur-[2px]"
        />
        {/* left-weighted legibility wash + blend to page at the bottom */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/35 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-sand via-black/10 to-black/30 dark:from-sand"
        />

        <SiteHeader overlay />

        <div className="relative mx-auto flex w-full  flex-col justify-center px-5 py-32 sm:px-8">
          <div className="pt-20 w-full flex flex-col items-center justify-center">
            <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
              </span>
              47 coopératives · tout Madagascar
            </div>
            <h1
              className="animate-rise mt-5 text-center font-display text-4xl font-bold leading-[1] tracking-tight text-white [text-shadow:0_2px_40px_rgba(0,0,0,.5)] sm:mt-6 sm:text-6xl md:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              Votre place,
              <br />
              réservée en <span className="text-orange">2 minutes</span>.
            </h1>
            <p
              className="animate-rise mt-5 text-pretty text-center text-lg text-white/85 [text-shadow:0_1px_20px_rgba(0,0,0,.45)]"
              style={{ animationDelay: "150ms" }}
            >
              Comparez les départs taxi-brousse, choisissez votre siège, payez
              par Mobile Money. Billet QR instantané.
            </p>
            <div
              className="animate-rise mt-8 flex flex-wrap items-center justify-center gap-4"
              style={{ animationDelay: "220ms" }}
            >
              <Link href="/search">
                <Button size="lg">
                  Réserver maintenant <ArrowRight size={18} />
                </Button>
              </Link>
              <a
                href="https://play.google.com/store/apps/details?id=ts.mila.cooperativeplus"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <GooglePlayIcon className="h-5 w-5" />
                <span className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-normal text-white/70">
                    Disponible sur
                  </span>
                  Google Play
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* tabbed search — sits near the bottom of the hero */}
        <div
          className="animate-rise relative z-10 mx-auto w-full max-w-5xl px-5 pb-10 sm:pb-14"
          style={{ animationDelay: "300ms" }}
        >
          <SearchBar />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm font-medium text-white/85">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={15} className="text-green-700" /> Sièges garantis
            </span>
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <PayChip>
                <span className="inline-grid h-3.5 w-3.5 place-items-center rounded-[2px] bg-[#0f7c1aff] text-[8px] font-extrabold leading-none text-white">
                  M
                </span>
                <b style={{ color: "#0f7c1aff" }}>MVola</b>
              </PayChip>
              <PayChip>
                <span className="inline-grid h-3.5 w-3.5 place-items-center rounded-[2px] bg-[#FF7900] text-[8px] font-extrabold leading-none text-white">
                  O
                </span>
                <b className="text-[#222]">Orange Money</b>
              </PayChip>
              <PayChip>
                <span className="inline-grid h-3.5 w-3.5 place-items-center rounded-[2px] text-[#E40000] bg-[#E40000] text-[8px] font-extrabold leading-none ">
                  E
                </span>
                <b style={{ color: "#E40000" }}>Airtel Money</b>
              </PayChip>
              <PayChip>
                <b className="italic tracking-tight text-[#1A1F71]">VISA</b>
              </PayChip>
              <PayChip>
                <MastercardIcon className="h-3.5 w-auto" />
              </PayChip>
            </span>
            <span className="inline-flex items-center gap-2">
              <Ticket size={15} className="text-green" /> Billet QR
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats ribbon ─────────────────────────────────────── */}
      <section className="reveal mx-auto mt-16 max-w-5xl px-5">
        <div className="grid grid-cols-2 divide-ink/8 overflow-hidden rounded-md border border-ink/8 bg-paper sm:grid-cols-4 sm:divide-x">
          {stats.map(([n, l]) => (
            <div key={l} className="px-6 py-7 text-center">
              <p className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                {n}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-soft/70">
                {l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular routes ───────────────────────────────────── */}
      <section id="routes" className="reveal mx-auto max-w-6xl px-5 py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-orange">
              Destinations
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              Trajets populaires
            </h2>
          </div>
          <Link
            href="/search"
            className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-orange sm:inline-flex"
          >
            Tout voir{" "}
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
        {popularRoutes.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink/15 bg-paper p-12 text-center text-ink-soft">
            Aucun trajet programmé pour le moment. Revenez bientôt.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularRoutes.map((r) => (
              <Link
                key={`${r.from}-${r.to}`}
                href={`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}
                className="group relative overflow-hidden rounded-md border border-ink/8 bg-paper p-5 transition-all hover:-translate-y-1 hover:border-orange/30 hover:shadow-[0_20px_40px_-18px_rgba(245,130,31,.35)]"
              >
                <div
                  aria-hidden
                  className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange/0 blur-2xl transition-colors duration-500 group-hover:bg-orange/15"
                />
                <div className="flex items-center gap-2 font-display text-lg font-bold">
                  <span>{r.from}</span>
                  <ArrowRight
                    size={16}
                    className="text-orange transition-transform group-hover:translate-x-0.5"
                  />
                  <span>{r.to}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-ink-soft">
                  {r.dur && (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={13} /> {r.dur}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-ink-soft/30" />
                    </>
                  )}
                  <span>
                    {r.coops} coopérative{r.coops > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap  items-center gap-3 text-sm text-ink-soft">
                  {r.tags &&
                    Array.from(r.tags).map((tag) => (
                      <TagBadge
                        key={tag.id}
                        name={tag.name}
                        color={tag.color}
                      />
                    ))}
                </div>
                <div className="mt-5 flex items-end justify-between border-t border-ink/8 pt-4">
                  <span className="text-sm text-ink-soft">
                    dès{" "}
                    <span className="font-mono text-xl font-bold text-ink">
                      {fmtMoney(r.price)}
                    </span>
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-ink/[.05] text-ink-soft transition-all group-hover:bg-orange group-hover:text-white">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how" className="reveal border-y border-ink/8 bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="max-w-xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-orange">
              Comment ça marche
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              Réserver, simplement
            </h2>
            <p className="mt-3 text-lg text-ink-soft">
              Trois étapes, deux minutes, zéro file d'attente.
            </p>
          </div>
          <div className="relative mt-14 grid gap-x-8 gap-y-12 md:grid-cols-3">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-orange/0 via-orange/30 to-orange/0 md:block"
            />
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative">
                  <div className="flex items-center gap-3">
                    <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-strong text-white shadow-lg ring-4 ring-paper">
                      <Icon size={19} />
                    </div>
                    <span className="font-mono text-sm font-bold text-orange">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-ink-soft">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────── */}
      <section className="reveal mx-auto max-w-6xl px-5 py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-orange">
              Avis voyageurs
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              Ils voyagent déjà mieux
            </h2>
          </div>
          <div className="hidden items-center gap-1 text-orange sm:flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={18} className="fill-orange" />
            ))}
            <span className="ml-2 font-mono text-sm font-bold text-ink">
              4.8/5
            </span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <figure
              key={r.name}
              className="relative flex flex-col rounded-md border border-ink/8 bg-paper p-6"
            >
              <Quote size={26} className="text-orange/30" />
              <blockquote className="mt-3 flex-1 text-pretty text-[15px] leading-relaxed text-ink/90">
                {r.text}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-ink/8 pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-strong text-xs font-bold text-white">
                  {r.name[0]}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {r.name}
                  </span>
                  <span className="block font-mono text-xs text-ink-soft">
                    {r.route}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Coop CTA ─────────────────────────────────────────── */}
      <section className="reveal mx-auto max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-xl bg-strong px-8 py-16 text-white md:px-16 md:py-20">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange/25 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-green/20 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-orange">
              Espace professionnel
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
              Vous gérez une coopérative ?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/70">
              Routes, véhicules, horaires, réservations et paiements dans un
              seul tableau de bord. 14 jours d'essai gratuit.
            </p>
            <Link href="/coop/request">
              <Button size="lg" className="mt-8">
                Démarrer gratuitement <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-ink/8 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-12 text-center text-sm text-ink-soft/60">
          <Logo height={36} width={150} />
          <p>© 2026 Cooperative Plus · Madagascar</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-ink-soft/50">
            <Link href="/terms" className="transition-colors hover:text-orange">
              Conditions d&apos;utilisation
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-orange"
            >
              Confidentialité
            </Link>
            <Link
              href="/data-deletion"
              className="transition-colors hover:text-orange"
            >
              Suppression de données
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

/** White pill holding a payment-brand mark (pops on the dark hero). */
function PayChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-white px-2 py-1 text-[11px] font-bold leading-none shadow-sm">
      {children}
    </span>
  );
}

function MastercardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" className={className} aria-hidden>
      <circle cx="13" cy="10" r="8" fill="#EB001B" />
      <circle cx="19" cy="10" r="8" fill="#F79E1B" />
      <path d="M16 4a8 8 0 0 0 0 12 8 8 0 0 0 0-12z" fill="#FF5F00" />
    </svg>
  );
}

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
    </svg>
  );
}
