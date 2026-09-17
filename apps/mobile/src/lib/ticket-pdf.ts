import * as Print from "expo-print";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import QRCode from "qrcode";
import { fmtMoney } from "./cn";
import { bookingStatusFr, fmtTime } from "./domain";

type TicketLike = { seatLabel: string; passengerName?: string | null; qrToken: string };
type Args = {
  reference: string;
  status: string;
  coopName?: string | null;
  coopLogoUrl?: string | null;
  coopBrandColor?: string | null;
  originName?: string | null;
  destName?: string | null;
  departDate?: string | null;
  departureAt?: number | string | null;
  totalAmount: number;
  currency: string;
  tagName?: string | null;
  tagColor?: string | null;
  vehicleLabel?: string | null;
  vehicleReg?: string | null;
  driverName?: string | null;
  tickets: TicketLike[];
};

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

const PALETTE = ["#14314C", "#D9A441", "#62b22e", "#2b6f8f", "#c2902f"];
function colorFor(name: string): string {
  let s = 0;
  for (let i = 0; i < name.length; i++) s += name.charCodeAt(i);
  return PALETTE[s % PALETTE.length]!;
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

function logoHtml(a: Args): string {
  if (a.coopLogoUrl) return `<img class="logo" src="${esc(a.coopLogoUrl)}" />`;
  const color = a.coopBrandColor || colorFor(a.coopName ?? "");
  return `<div class="logo mono" style="background:${color}1f;color:${color}">${esc(initials(a.coopName ?? ""))}</div>`;
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** "jeudi 25 juin à 06:00". */
function longDepart(departDate?: string | null, departureAt?: number | string | null): string {
  if (!departDate) return "";
  const d = new Date(`${departDate}T00:00:00`);
  const head = `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
  return departureAt ? `${head} à ${fmtTime(departureAt)}` : head;
}

function field(k: string, v: string): string {
  return `<div><div class="f-lbl">${esc(k)}</div><div class="f-val">${esc(v)}</div></div>`;
}
function row(k: string, v: string): string {
  return `<div class="row"><span class="row-k">${esc(k)}:</span><span class="row-v">${esc(v)}</span></div>`;
}

// Mirrors the client web ticket exactly: gold header bar, dotted "map" body
// with route pins + a date/time/seat/price field grid, dashed secondary row,
// and a navy tear-off stub (perforated edge) with reference + QR on the right.
async function html(a: Args): Promise<string> {
  const { label } = bookingStatusFr(a.status);
  const logo = logoHtml(a);
  const seats = a.tickets.map((t) => t.seatLabel).join(", ") || "—";
  const d = a.departDate ? new Date(`${a.departDate}T00:00:00`) : null;
  const dateStr = d
    ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
    : "—";

  // One QR for the booking (first ticket token, fallback to reference).
  const qr = await QRCode.toString(a.tickets[0]?.qrToken ?? a.reference, {
    type: "svg", margin: 0, width: 200, color: { dark: "#14314C", light: "#ffffff" },
  });

  const secondary = [
    row("Véhicule", a.vehicleReg ? `${a.vehicleLabel ?? "Voiture 1"} · ${a.vehicleReg}` : (a.vehicleLabel ?? "Voiture 1")),
    a.driverName ? row("Chauffeur", a.driverName) : "",
    row("Passagers", String(a.tickets.length)),
    row("Statut", label),
  ].join("");

  return `<!doctype html><html><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: 230mm 95mm; margin: 0; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #14314C; margin: 0;
      padding: 6mm; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    .ticket { display: flex; width: 840px; margin: 0 auto; border-radius: 12px; overflow: hidden;
      box-shadow: 0 12px 30px -14px rgba(20,49,76,.4); }
    .main { min-width: 0; flex: 1; }

    .gold { display: flex; align-items: center; justify-content: space-between; gap: 12px;
      background: #D9A441; color: #14314C; padding: 14px 20px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .word { font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
    .coop-side { display: flex; align-items: center; gap: 10px; }
    .coop-name { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: rgba(20,49,76,.7); }
    .logo { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(20,49,76,.2); flex-shrink: 0; }
    .logo.mono { display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; background: rgba(20,49,76,.12); }

    .map { position: relative; padding: 22px 20px;
      background-image: radial-gradient(rgba(20,49,76,.09) 1.1px, transparent 1.2px); background-size: 13px 13px; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .route { position: relative; padding-left: 28px; }
    .route .line { position: absolute; left: 7px; top: 26px; bottom: 26px; width: 0; border-left: 2px dashed rgba(20,49,76,.25); }
    .route .pin { position: absolute; left: -28px; top: 2px; width: 17px; height: 17px; }
    .route .pin::before { content: ""; position: absolute; left: 5px; top: 0; width: 7px; height: 7px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: #D9A441; }
    .route .f-lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .16em; color: rgba(20,49,76,.45); }
    .route .f-val { font-size: 24px; font-weight: 800; text-transform: uppercase; line-height: 1.1; letter-spacing: -.02em; margin-top: 1px; }
    .route .dest { margin-top: 24px; position: relative; }

    .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; align-self: center; }
    .f-lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .16em; color: rgba(20,49,76,.45); }
    .f-val { font-size: 18px; font-weight: 800; text-transform: uppercase; line-height: 1.2; letter-spacing: -.01em; margin-top: 1px; }

    .tag { display: inline-block; margin-top: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .04em; color: #fff; padding: 2px 8px; border-radius: 4px; }

    .seam { margin-top: 22px; border-top: 1px dashed rgba(20,49,76,.15); padding-top: 14px;
      display: flex; flex-wrap: wrap; gap: 8px 24px; font-size: 13px; }
    .row-k { color: rgba(20,49,76,.55); font-weight: 300; margin-right: 6px; }
    .row-v { font-weight: 600; }

    .stub { position: relative; width: 220px; flex-shrink: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: space-between; background: #14314C; color: #fff; padding: 16px 12px; text-align: center; }
    .stub .perf { position: absolute; left: -9px; top: 0; bottom: 0; width: 16px;
      background-image: radial-gradient(circle at left, #fff 9px, transparent 10px); background-size: 100% 18px; }
    .stub .lbl { font-size: 8px; text-transform: uppercase; letter-spacing: .16em; color: #D9A441; }
    .stub .ref { font-size: 22px; font-weight: 800; letter-spacing: .06em; color: #D9A441; margin-top: 2px; font-family: ui-monospace, Menlo, monospace; }
    .stub .route-txt { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .12em; color: rgba(255,255,255,.7); line-height: 1.5; }
    .stub .qr { flex-shrink: 0; background: #fff; padding: 6px; border-radius: 4px; }
    .stub .qr svg { display: block; width: 72px; height: 72px; }

    .foot { max-width: 840px; margin: 8px auto 0; font-size: 10px; color: #8a93b4; text-align: center; line-height: 1.4; }
  </style></head><body>
    <div class="ticket">
      <div class="main">
        <div class="gold">
          <div class="brand">
            <span class="word">Ticket</span>
            ${a.tagName ? `<span class="tag" style="background:${esc(a.tagColor) || "#14314C"}">${esc(a.tagName)}</span>` : ""}
          </div>
          <div class="coop-side">
            <span class="coop-name">${esc(a.coopName)}</span>
            ${logo}
          </div>
        </div>
        <div class="map">
          <div class="cols">
            <div class="route">
              <div class="line"></div>
              <div style="position:relative">
                <div class="pin"></div>
                <div class="f-lbl">Départ</div>
                <div class="f-val">${esc(a.originName)}</div>
              </div>
              <div class="dest">
                <div class="pin"></div>
                <div class="f-lbl">Destination</div>
                <div class="f-val">${esc(a.destName)}</div>
              </div>
            </div>
            <div class="fields">
              ${field("Date", dateStr)}
              ${field("Heure", a.departureAt ? fmtTime(a.departureAt) : "—")}
              ${field("Sièges", seats)}
              ${field("Total", fmtMoney(a.totalAmount, a.currency))}
            </div>
          </div>
          <div class="seam">${secondary}</div>
        </div>
      </div>
      <div class="stub">
        <div class="perf"></div>
        <div>
          <div class="lbl">Réf</div>
          <div class="ref">${esc(a.reference)}</div>
        </div>
        <div class="route-txt">${esc(a.originName)}<br />${esc(a.destName)}</div>
        <div class="qr">${qr}</div>
      </div>
    </div>
    <div class="foot">Présentez ce QR code au chauffeur à l'embarquement. · ${esc(longDepart(a.departDate, a.departureAt))}<br />Cooperative+</div>
  </body></html>`;
}

/** Generate a PDF and open the share/save sheet. */
export async function shareTicketPdf(a: Args): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: await html(a) });
  if (await isAvailableAsync()) {
    await shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Billet Cooperative Plus", UTI: "com.adobe.pdf" });
  }
}

/** Open the native print dialog. */
export async function printTicket(a: Args): Promise<void> {
  await Print.printAsync({ html: await html(a) });
}
