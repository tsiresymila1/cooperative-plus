"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ArrowLeftRight, MapPin, UserRound } from "lucide-react";
import { db, notDeleted } from "@cp/ui";
import FieldCombobox from "@/components/ui/FieldCombobox";
import FieldDatePicker from "@/components/ui/FieldDatePicker";

const PASSENGERS = ["1", "2", "3", "4", "5", "6"];

/* Template booking form — identical layout/classes; wired to our real
   destinations and the /search route (Coopérative Plus features). */
export default function BookingForm({ className = "" }: { className?: string }) {
  const router = useRouter();
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const { data } = db.useQuery({ destinations: { $: { where: { isGlobal: true }, order: { name: "asc" } } } });
  const cities = [...new Set((data?.destinations ?? []).filter(notDeleted).map((d: any) => d.name as string))];

  return (
    <form
      className={`relative grid w-full grid-cols-2 gap-px bg-white lg:grid-cols-[289fr_299fr_284fr_283fr_228px] ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        const from = String(fd.get("from") || "");
        const to = String(fd.get("to") || "");
        const date = String(fd.get("date") || "");
        const pax = String(fd.get("passengers") || "1").replace(/\D/g, "") || "1";
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (date) params.set("date", date);
        params.set("pax", pax);
        router.push(`/search?${params.toString()}`);
      }}
    >
      <FieldCombobox name="from" label="Départ :" placeholder="Ville de départ" options={cities} icon={MapPin} />
      <button
        type="button"
        aria-label="Inverser départ et arrivée"
        onClick={() => { const f = fromRef.current, t = toRef.current; if (!f || !t) return; const v = f.value; f.value = t.value; t.value = v; }}
        className="absolute left-[21%] top-1/2 z-20 hidden size-[38px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy shadow-[0_2px_10px_rgba(20,49,76,0.15)] transition-colors duration-300 hover:text-gold lg:flex"
      >
        <ArrowLeftRight className="size-4" strokeWidth={2} />
      </button>
      <FieldCombobox name="to" label="Arrivée :" placeholder="Destination" options={cities} icon={MapPin} />
      <FieldDatePicker name="date" label="Date :" />
      <FieldCombobox name="passengers" label="Voyageurs :" placeholder="1" options={PASSENGERS} defaultValue="1" icon={UserRound} />
      <button
        type="submit"
        className="h-[104px] w-full bg-gold px-[25px] font-display text-[22px] font-semibold uppercase leading-tight text-navy transition-colors duration-[250ms] ease-out hover:bg-navy hover:text-white"
      >
        Rechercher
      </button>
    </form>
  );
}
