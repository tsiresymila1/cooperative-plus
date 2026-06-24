"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, MapPin, Search, Users } from "lucide-react";
import { Button, db, notDeleted } from "@cp/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DatePicker } from "./ui/date-picker";

export function SearchBar() {
  const router = useRouter();
  // Real destinations from InstantDB (global, deduped, not deleted).
  const { data } = db.useQuery({ destinations: { $: { where: { isGlobal: true }, order: { name: "asc" } } } });
  const cities = [...new Set((data?.destinations ?? []).filter(notDeleted).map((d: any) => d.name))];
  const [from, setFrom] = useState("Antananarivo");
  const [to, setTo] = useState("Mahajanga");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [pax, setPax] = useState("2");
  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="rounded-sm border border-ink/10 bg-paper p-2 shadow-[0_1px_3px_rgba(15,28,82,.04),0_20px_50px_-20px_rgba(15,28,82,.18)]">
      <div className="flex flex-col gap-1 md:flex-row md:items-stretch">
        {/* From */}
        <Cell label="Départ" icon={<MapPin size={15} />}>
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-base font-semibold shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Cell>

        <div className="relative flex items-center justify-center md:w-0">
          <button onClick={swap} aria-label="Inverser"
            className="z-10 grid h-9 w-9 place-items-center bg-paper text-ink-soft transition-all hover:rotate-180 hover:border-orange hover:text-orange">
            <ArrowRightLeft size={14} />
          </button>
        </div>

        {/* To */}
        <Cell label="Arrivée" icon={<MapPin size={15} className="text-orange" />}>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-base font-semibold shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Cell>

        <Divider />

        {/* Date */}
        <Cell label="Date">
          <DatePicker value={date} onChange={setDate} className="h-7 border-0 p-0 text-base font-semibold shadow-none focus:ring-0" />
        </Cell>

        <Divider />

        {/* Passengers */}
        <Cell label="Voyageurs" icon={<Users size={15} />}>
          <input type="number" min={1} max={20} value={pax} onChange={(e) => setPax(e.target.value)}
            className="h-7 w-full bg-transparent text-base font-semibold text-ink outline-none" />
        </Cell>

        <div className="p-1 md:flex md:items-center">
          <Button size="lg" className="h-14 w-full md:aspect-square md:w-14 md:rounded-xl md:px-0" onClick={() => {
            const dd = date ?? new Date();
            const d = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
            router.push(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${d}&pax=${pax}`);
          }}>
            <Search size={20} /><span className="md:hidden">Rechercher</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex-1 cursor-pointer rounded-xl px-4 py-3 transition-colors hover:bg-ink/[.025]">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">{icon}{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function Divider() {
  return <div className="mx-1 hidden w-px self-center bg-ink/8 md:block md:h-10" />;
}
