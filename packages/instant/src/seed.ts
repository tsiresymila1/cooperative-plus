/**
 * Seed InstantDB with realistic demo data (idempotent — fixed ids = upsert).
 * Run:  INSTANT_APP_ID=... INSTANT_ADMIN_TOKEN=... pnpm --filter @cp/instant seed
 *
 * No fake user/bookings are created — those come from the real auth + booking
 * flow. This only seeds the network: destinations, cooperatives, plans,
 * vehicles, routes and upcoming trip instances people can actually book.
 */
import { adminDb } from "./admin";
import { PLAN_DEFS } from "./subscription";

const tx = adminDb.tx;
const now = Date.now();
const uid = (p: string, n: number) => `${p}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// Same algorithm the coop admin's model editor uses (packages/ui's
// `buildLayout`, duplicated here — that module is "use client" + depends on
// @cp/instant, so importing it from the seed would be a circular/DOM-y mess).
// A plain rows×cols grid; the last cell of the first row is the driver.
function buildLayout(rows: number, cols: number) {
  const cells: { row: number; col: number; type: string; label?: string }[] = [];
  let n = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const isDriver = r === 0 && c === cols - 1;
      cells.push({ row: r, col: c, type: isDriver ? "driver" : "seat", label: isDriver ? undefined : `${++n}` });
    }
  return cells;
}

// Vehicle dimensions per type — seat count is always rows*cols-1 (the driver
// cell), matching how a real coop-configured model works, never a separate
// hand-picked number that could drift from the actual grid.
const VEH_DIMS: Record<string, { rows: number; cols: number }> = {
  minibus_15: { rows: 4, cols: 4 },
  minibus_18: { rows: 5, cols: 4 },
  bus_30: { rows: 8, cols: 4 },
};
const seatsOf = (veh: string) => { const d = VEH_DIMS[veh]!; return d.rows * d.cols - 1; };

const DESTS = [
  ["Antananarivo", "Analamanga", true], ["Mahajanga", "Boeny", true], ["Toamasina", "Atsinanana", true],
  ["Fianarantsoa", "Haute Matsiatra", true], ["Antsirabe", "Vakinankaratra", true], ["Toliara", "Atsimo-Andrefana", true], ["Morondava", "Menabe", false],
] as const;
const dIdx = (name: string) => uid("0a", DESTS.findIndex((d) => d[0] === name) + 1);

const COOPS = [
  { id: uid("0c", 1), slug: "kofmad", name: "Kofmad", status: "active" },
  { id: uid("0c", 2), slug: "soatrans", name: "Soatrans", status: "active" },
  { id: uid("0c", 3), slug: "trans-betsileo", name: "Trans Betsileo", status: "active" },
];

const ROUTES = [
  { coop: 0, from: "Antananarivo", to: "Mahajanga", price: 35000, km: 570, dur: 480, veh: "minibus_18" },
  { coop: 0, from: "Antananarivo", to: "Toamasina", price: 30000, km: 350, dur: 420, veh: "minibus_18" },
  { coop: 1, from: "Antananarivo", to: "Toamasina", price: 28000, km: 350, dur: 430, veh: "bus_30" },
  { coop: 1, from: "Antananarivo", to: "Fianarantsoa", price: 32000, km: 410, dur: 540, veh: "bus_30" },
  { coop: 2, from: "Antananarivo", to: "Fianarantsoa", price: 30000, km: 410, dur: 540, veh: "minibus_15" },
  { coop: 2, from: "Antananarivo", to: "Antsirabe", price: 12000, km: 170, dur: 180, veh: "minibus_15" },
  { coop: 0, from: "Antsirabe", to: "Toliara", price: 60000, km: 760, dur: 840, veh: "minibus_18" },
];

const TIMES = ["06:00", "07:30", "13:00", "18:00"];
const DAYS = 5; // today + 4

async function main() {
  // base entities
  const base = [
    ...DESTS.map(([name, region, pop], i) => tx.destinations[uid("0a", i + 1)].update({ name, slug: name.toLowerCase().replace(/\s+/g, "-"), region, country: "MG", isPopular: pop, isGlobal: true, createdAt: now })),
    ...PLAN_DEFS.map((p) => tx.plans[p.id]!.update({ code: p.code, name: p.name, priceAmount: p.priceAmount, currency: "MGA", interval: p.interval, maxVehicles: p.maxVehicles, maxRoutes: p.maxRoutes, maxAssistants: p.maxAssistants, maxTripsMonth: p.maxTripsMonth, transactionFeeBps: p.transactionFeeBps, isActive: true })),
    ...COOPS.map((c) => tx.cooperatives[c.id].update({ slug: c.slug, legalName: `${c.name} Coopérative`, displayName: c.name, currency: "MGA", timezone: "Indian/Antananarivo", subscriptionStatus: c.status, cutoffHours: 2, refundPct: 50, paymentMethods: ["cash", "mobile_money", "card"], createdAt: now })),
    // enable all global destinations for each cooperative
    ...COOPS.map((c) => tx.cooperatives[c.id].link({ enabledDestinations: DESTS.map((_, i) => uid("0a", i + 1)) })),
    ...COOPS.map((c, i) => {
      const type = ["minibus_18", "bus_30", "minibus_15"][i]!;
      return tx.vehicles[uid("0e", i + 1)].update({ registrationNo: `${1000 + i} TBA`, name: ["Mercedes Sprinter", "King Long Bus", "Toyota Hiace"][i]!, type, seatCount: seatsOf(type), status: "active", createdAt: now }).link({ cooperative: c.id });
    }),
  ];
  await adminDb.transact(base);

  // routes
  await adminDb.transact(ROUTES.map((r, i) =>
    tx.routes[uid("0d", i + 1)].update({ name: `${r.from} → ${r.to}`, basePrice: r.price, currency: "MGA", distanceKm: r.km, durationMin: r.dur, status: "active", createdAt: now })
      .link({ cooperative: COOPS[r.coop]!.id, origin: dIdx(r.from), destination: dIdx(r.to) })));

  // trip instances: each route × DAYS × 2 times
  const today = new Date(now);
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()); // today, UTC midnight → toISOString gives the intended local day
  const day = 86400000;
  let tripN = 0;
  const steps = [];
  for (let ri = 0; ri < ROUTES.length; ri++) {
    const r = ROUTES[ri]!;
    for (let d = 0; d < DAYS; d++) {
      const times = ri % 2 === 0 ? [TIMES[0], TIMES[2]] : [TIMES[1], TIMES[3]];
      for (const time of times) {
        tripN++;
        const dateMs = start + d * day;
        const departDate = new Date(dateMs).toISOString().slice(0, 10);
        const departureAt = new Date(`${departDate}T${time}:00+03:00`).getTime();
        const booked = 0; // real occupancy comes from real bookings (no fake)
        const dims = VEH_DIMS[r.veh]!;
        steps.push(
          tx.tripInstances[uid("0f", tripN)].update({
            originName: r.from, destName: r.to, departDate, departureAt,
            arrivalEstimateAt: departureAt + r.dur * 60000,
            routeName: `${r.from} → ${r.to}`, coopName: COOPS[r.coop]!.name,
            vehicleName: ["Mercedes Sprinter", "King Long Bus", "Toyota Hiace"][r.coop]!,
            status: "scheduled", price: r.price, currency: "MGA",
            seatsTotal: seatsOf(r.veh), seatsBooked: booked, seatMapSnapshot: buildLayout(dims.rows, dims.cols), createdAt: now,
            driverName: ["Rakoto", "Rabe", "Randria"][r.coop]!,
          }).link({ cooperative: COOPS[r.coop]!.id, route: uid("0d", ri + 1), vehicle: uid("0e", r.coop + 1) }),
        );
      }
    }
  }
  // chunk to keep transactions reasonable
  for (let i = 0; i < steps.length; i += 50) await adminDb.transact(steps.slice(i, i + 50));

  console.log(`✓ Seeded ${DESTS.length} destinations, ${COOPS.length} cooperatives, ${ROUTES.length} routes, ${tripN} trip instances`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
