/**
 * Seed InstantDB with realistic demo data (idempotent — fixed ids = upsert).
 * Run:  INSTANT_APP_ID=... INSTANT_ADMIN_TOKEN=... pnpm --filter @cp/instant seed
 *
 * No fake user/bookings are created — those come from the real auth + booking
 * flow. This only seeds the network: destinations, cooperatives, plans,
 * vehicles, routes and upcoming trip instances people can actually book.
 */
import { adminDb } from "./admin";

const tx = adminDb.tx;
const now = Date.now();
const uid = (p: string, n: number) => `${p}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const seatMap18 = (() => {
  const cells: { row: number; col: number; type: string; label?: string }[] = [{ row: 0, col: 0, type: "seat", label: "1" }, { row: 0, col: 2, type: "driver" }];
  let n = 1;
  for (let r = 1; r <= 4; r++) { cells.push({ row: r, col: 0, type: "seat", label: `${++n}` }, { row: r, col: 1, type: "seat", label: `${++n}` }, { row: r, col: 2, type: "aisle" }, { row: r, col: 3, type: "seat", label: `${++n}` }); }
  for (let c = 0; c <= 3; c++) cells.push({ row: 5, col: c, type: "seat", label: `${++n}` });
  cells.push({ row: 6, col: 0, type: "seat", label: `${++n}` });
  return cells;
})();

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
  { coop: 0, from: "Antananarivo", to: "Mahajanga", price: 35000, km: 570, dur: 480, veh: "minibus_18", seats: 18 },
  { coop: 0, from: "Antananarivo", to: "Toamasina", price: 30000, km: 350, dur: 420, veh: "minibus_18", seats: 18 },
  { coop: 1, from: "Antananarivo", to: "Toamasina", price: 28000, km: 350, dur: 430, veh: "bus_30", seats: 30 },
  { coop: 1, from: "Antananarivo", to: "Fianarantsoa", price: 32000, km: 410, dur: 540, veh: "bus_30", seats: 30 },
  { coop: 2, from: "Antananarivo", to: "Fianarantsoa", price: 30000, km: 410, dur: 540, veh: "minibus_15", seats: 15 },
  { coop: 2, from: "Antananarivo", to: "Antsirabe", price: 12000, km: 170, dur: 180, veh: "minibus_15", seats: 15 },
  { coop: 0, from: "Antsirabe", to: "Toliara", price: 60000, km: 760, dur: 840, veh: "minibus_18", seats: 18 },
];

const TIMES = ["06:00", "07:30", "13:00", "18:00"];
const DAYS = 5; // today + 4

async function main() {
  // base entities
  const base = [
    ...DESTS.map(([name, region, pop], i) => tx.destinations[uid("0a", i + 1)].update({ name, slug: name.toLowerCase().replace(/\s+/g, "-"), region, country: "MG", isPopular: pop, isGlobal: true, createdAt: now })),
    tx.plans[uid("0b", 1)].update({ code: "growth", name: "Growth", priceAmount: 120000, currency: "MGA", interval: "month", maxVehicles: 8, maxRoutes: 15, maxAssistants: 5, maxTripsMonth: 1500, transactionFeeBps: 200, isActive: true }),
    tx.plans[uid("0b", 2)].update({ code: "pro", name: "Pro", priceAmount: 280000, currency: "MGA", interval: "month", maxVehicles: 25, maxRoutes: 999, maxAssistants: 15, maxTripsMonth: 10000, transactionFeeBps: 100, isActive: true }),
    ...COOPS.map((c) => tx.cooperatives[c.id].update({ slug: c.slug, legalName: `${c.name} Coopérative`, displayName: c.name, currency: "MGA", timezone: "Indian/Antananarivo", subscriptionStatus: c.status, cutoffHours: 2, refundPct: 50, paymentMethods: ["cash", "mobile_money", "card"], createdAt: now })),
    // enable all global destinations for each cooperative
    ...COOPS.map((c) => tx.cooperatives[c.id].link({ enabledDestinations: DESTS.map((_, i) => uid("0a", i + 1)) })),
    ...COOPS.map((c, i) => tx.vehicles[uid("0e", i + 1)].update({ registrationNo: `${1000 + i} TBA`, name: ["Mercedes Sprinter", "King Long Bus", "Toyota Hiace"][i]!, type: ["minibus_18", "bus_30", "minibus_15"][i]!, seatCount: [18, 30, 15][i]!, status: "active", createdAt: now }).link({ cooperative: c.id })),
  ];
  await adminDb.transact(base);

  // routes
  await adminDb.transact(ROUTES.map((r, i) =>
    tx.routes[uid("0d", i + 1)].update({ name: `${r.from} → ${r.to}`, basePrice: r.price, currency: "MGA", distanceKm: r.km, durationMin: r.dur, status: "active", createdAt: now })
      .link({ cooperative: COOPS[r.coop]!.id, origin: dIdx(r.from), destination: dIdx(r.to) })));

  // trip instances: each route × DAYS × 2 times
  const start = Date.UTC(2026, 5, 19); // UTC midnight → toISOString gives the intended local day
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
        steps.push(
          tx.tripInstances[uid("0f", tripN)].update({
            originName: r.from, destName: r.to, departDate, departureAt,
            arrivalEstimateAt: departureAt + r.dur * 60000,
            routeName: `${r.from} → ${r.to}`, coopName: COOPS[r.coop]!.name,
            vehicleName: ["Mercedes Sprinter", "King Long Bus", "Toyota Hiace"][r.coop]!,
            status: "scheduled", price: r.price, currency: "MGA",
            seatsTotal: r.seats, seatsBooked: booked, seatMapSnapshot: seatMap18, createdAt: now,
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
