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

const PALETTE = ["#16266b", "#f5821f", "#62b22e", "#2b6f8f", "#d96d0f"];
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

function row(k: string, v: string): string {
  return `<div class="row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`;
}

// 80mm thermal receipt — single ticket for the whole booking, mirrors the app design.
async function html(a: Args): Promise<string> {
  const { label } = bookingStatusFr(a.status);
  const logo = logoHtml(a);
  const seats = a.tickets.map((t) => t.seatLabel).join(", ") || "—";

  // One QR for the booking (first ticket token, fallback to reference).
  const qr = await QRCode.toString(a.tickets[0]?.qrToken ?? a.reference, {
    type: "svg", margin: 0, width: 280, color: { dark: "#000000", light: "#ffffff" },
  });

  return `<!doctype html><html><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #0f2d5c; margin: 0;
      width: 80mm; padding: 5mm 4mm; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    .ticket { border: 1px solid #0f2d5c; border-radius: 8px; overflow: hidden; }

    .head { background: #00183d; color: #fff; padding: 10px 12px 14px; }
    .bar { display: flex; align-items: center; gap: 8px; }
    .logo { width: 26px; height: 26px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }
    .logo.mono { display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; }
    .coop { font-size: 13px; font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ref { text-align: right; }
    .ref .lbl { font-size: 8px; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.5); }
    .ref .val { font-family: ui-monospace, Menlo, monospace; font-size: 13px; font-weight: 800; color: #f5821f; }
    .route { font-size: 20px; font-weight: 800; line-height: 1.1; margin-top: 12px; }
    .when { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: rgba(255,255,255,.75); margin-top: 4px; }

    .seam { border-top: 2px dashed #0f2d5c; }
    .body { padding: 12px; text-align: center; }
    .qr { width: 46mm; height: 46mm; margin: 0 auto 12px; }
    .qr svg { width: 100%; height: 100%; }
    .rows { text-align: left; }
    .row { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; border-bottom: 1px dotted #c2c8db; }
    .row:last-child { border-bottom: 0; }
    .row .k { font-size: 12px; color: #4a5680; }
    .row .v { font-size: 13px; font-weight: 700; }

    .code { font-family: ui-monospace, Menlo, monospace; font-size: 8px; color: #9aa3bd; word-break: break-all; margin-top: 8px; }
    .foot { margin-top: 8px; font-size: 9px; color: #8a93b4; text-align: center; line-height: 1.4; }
  </style></head><body>
    <div class="ticket">
      <div class="head">
        <div class="bar">
          ${logo}<span class="coop">${esc(a.coopName)}</span>
          <span class="ref"><span class="lbl">Réf</span><br /><span class="val">${esc(a.reference)}</span></span>
        </div>
        <div class="route">${esc(a.originName)} &rarr; ${esc(a.destName)}</div>
        ${a.tagName ? `<div style="margin-top:4px"><span style="display:inline-block;background:${esc(a.tagColor) || "#0f2d5c"};color:#fff;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:2px 7px;border-radius:4px">${esc(a.tagName)}</span></div>` : ""}
        <div class="when">${esc(longDepart(a.departDate, a.departureAt))}</div>
      </div>
      <div class="seam"></div>
      <div class="body">
        <div class="qr">${qr}</div>
        <div class="rows">
          ${row("Sièges", seats)}
          ${row("Véhicule", a.vehicleReg ? `${a.vehicleLabel ?? "Voiture 1"} · ${a.vehicleReg}` : (a.vehicleLabel ?? "Voiture 1"))}
          ${a.driverName ? row("Chauffeur", a.driverName) : ""}
          ${row("Passagers", String(a.tickets.length))}
          ${row("Total", fmtMoney(a.totalAmount, a.currency))}
          ${row("Statut", label)}
        </div>
        <div class="code">${esc(a.tickets[0]?.qrToken ?? a.reference)}</div>
      </div>
    </div>
    <div class="foot">Présentez ce QR code au chauffeur à l'embarquement.<br />Cooperative+</div>
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
