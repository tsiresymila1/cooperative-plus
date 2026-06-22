import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, MousePointerClick, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { Button, Logo } from "@cp/ui";
import { SiteHeader } from "@/components/site-header";
import { SearchBar } from "@/components/search-bar";
import { fmtMoney } from "@cp/ui";

const routes = [
  { from: "Antananarivo", to: "Mahajanga", price: 35000, dur: "8h", coops: 6 },
  { from: "Antananarivo", to: "Toamasina", price: 30000, dur: "7h", coops: 9 },
  { from: "Antananarivo", to: "Fianarantsoa", price: 28000, dur: "9h", coops: 5 },
  { from: "Antananarivo", to: "Antsirabe", price: 12000, dur: "3h", coops: 11 },
  { from: "Antsirabe", to: "Toliara", price: 60000, dur: "14h", coops: 4 },
  { from: "Antananarivo", to: "Morondava", price: 55000, dur: "12h", coops: 3 },
];
const steps = [
  { icon: MapPin, title: "Cherchez", desc: "Départ, arrivée, date. Comparez 47 coopératives en un coup d'œil." },
  { icon: MousePointerClick, title: "Choisissez votre siège", desc: "Plan du véhicule en temps réel. Siège maintenu 5 minutes." },
  { icon: Ticket, title: "Payez & embarquez", desc: "Mobile Money, carte ou espèces. Billet QR instantané." },
];

export default function Landing() {
  return (
    <main className="relative">
      {/* Modern layered background behind the hero */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-orange/25 blur-[120px]" />
        <div className="absolute -right-32 top-0 h-[26rem] w-[26rem] rounded-full bg-sky/20 blur-[130px]" />
        <div className="absolute left-1/2 top-48 h-80 w-80 -translate-x-1/2 rounded-full bg-green/12 blur-[130px]" />
        <div className="absolute inset-0 [background-image:radial-gradient(rgba(22,38,107,.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,#000_35%,transparent_78%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-[#fcfbf9]" />
      </div>

      <SiteHeader />

      {/* Hero — centered, calm */}
      <section className="relative mx-auto max-w-4xl px-5 pb-6 pt-16 text-center md:pt-24">
        <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-green" /> 47 coopératives · tout Madagascar
        </div>
        <h1 className="animate-rise mt-7 text-balance font-display text-[2.75rem] font-bold leading-[1.02] tracking-tight md:text-6xl" style={{ animationDelay: "60ms" }}>
          Votre place de taxi-brousse,<br className="hidden sm:block" /> réservée en <span className="text-orange">2 minutes</span>.
        </h1>
        <p className="animate-rise mx-auto mt-5 max-w-xl text-pretty text-lg text-ink-soft" style={{ animationDelay: "120ms" }}>
          Comparez les départs, choisissez votre siège, payez par Mobile Money. Billet QR instantané.
        </p>
      </section>

      {/* Search — the centerpiece */}
      <section className="animate-rise mx-auto max-w-4xl px-5" style={{ animationDelay: "180ms" }}>
        <SearchBar />
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-green" /> Sièges garantis</span>
          <span className="inline-flex items-center gap-2"><Wallet size={15} className="text-green" /> MVola · Orange · Airtel · Carte</span>
          <span className="inline-flex items-center gap-2"><Ticket size={15} className="text-green" /> Billet QR</span>
        </div>
      </section>

      {/* Popular routes */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Trajets populaires</h2>
          <Link href="/search" className="group inline-flex items-center gap-1.5 text-sm font-medium text-orange">
            Tout voir <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((r) => (
            <Link key={`${r.from}-${r.to}`} href="/search"
              className="group rounded-sm border border-ink/8 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[0_12px_30px_-12px_rgba(15,28,82,.18)]">
              <div className="flex items-center gap-2 text-[15px] font-semibold">
                <span>{r.from}</span>
                <ArrowRight size={15} className="text-orange" />
                <span>{r.to}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{r.coops} coopératives · {r.dur}</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-sm text-ink-soft">dès <span className="font-mono text-lg font-bold text-ink">{fmtMoney(r.price)}</span></span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/[.04] text-ink-soft transition-all group-hover:bg-orange group-hover:text-white">
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-ink/8 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-lg">
            <h2 className="font-display text-2xl font-bold md:text-3xl">Réserver, simplement</h2>
            <p className="mt-2 text-ink-soft">Trois étapes, deux minutes, zéro file d'attente.</p>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-sand"><Icon size={19} /></div>
                    <span className="font-mono text-sm text-ink-soft/50">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-ink-soft">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {[["47", "coopératives"], ["1 240+", "trajets / jour"], ["28", "villes"], ["4.8★", "note moyenne"]].map(([n, l]) => (
            <div key={l}>
              <p className="font-display text-4xl font-bold tracking-tight md:text-5xl">{n}</p>
              <p className="mt-1 text-sm text-ink-soft">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Coop CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="overflow-hidden rounded-3xl bg-ink px-8 py-14 text-sand md:px-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Vous gérez une coopérative ?</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-sand/70">Routes, véhicules, horaires, réservations et paiements dans un seul tableau de bord. 14 jours d'essai gratuit.</p>
            <Link href="/sign-up?role=coop"><Button size="lg" className="mt-7">Démarrer gratuitement <ArrowRight size={18} /></Button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/8 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-10 text-center text-sm text-ink-soft/60">
          <Logo />
          <p>© 2026 Cooperative Plus · Madagascar</p>
          <Link href="/coop" className="text-xs text-ink-soft/40 transition-colors hover:text-ink-soft">Espace professionnel</Link>
        </div>
      </footer>
    </main>
  );
}
