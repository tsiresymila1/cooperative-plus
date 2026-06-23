import * as Print from "expo-print";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import QRCode from "qrcode";
import { fmtMoney } from "./cn";
import { bookingStatusFr, fmtDateKey, fmtTime } from "./domain";

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

async function html(a: Args): Promise<string> {
  const { label } = bookingStatusFr(a.status);
  const dateStr = a.departDate ? fmtDateKey(a.departDate) : "";
  const timeStr = a.departureAt ? fmtTime(a.departureAt) : "--:--";
  const total = esc(fmtMoney(a.totalAmount, a.currency));
  const logo = logoHtml(a);

  // Pre-render each seat's QR as inline SVG.
  const qrs = await Promise.all(
    a.tickets.map((t) => QRCode.toString(t.qrToken, { type: "svg", margin: 0, width: 110, color: { dark: "#16266b", light: "#ffffff" } })),
  );

  const tickets = a.tickets
    .map((t, i) => {
      const cut = i === 0 ? "" : `<div class="cut"><span class="scis">&#9986;</span></div>`;
      return `${cut}
    <div class="ticket">
      <div class="main">
        <div class="bar">
          <div class="coopwrap">${logo}<span class="coop">${esc(a.coopName)}</span></div>
          <span class="status">${esc(label)}</span>
        </div>
        <div class="route">${esc(a.originName)}<span class="arrow">&rarr;</span><span class="dest">${esc(a.destName)}</span></div>
        <div class="grid">
          <div class="cell"><div class="k">Date</div><div class="v">${esc(dateStr)}</div></div>
          <div class="cell"><div class="k">Départ</div><div class="v">${esc(timeStr)}</div></div>
          <div class="cell"><div class="k">Passager</div><div class="v">${esc(t.passengerName || "—")}</div></div>
          <div class="cell"><div class="k">Référence</div><div class="v mono-txt">${esc(a.reference)}</div></div>
        </div>
        <div class="code">${esc(t.qrToken)}</div>
      </div>
      <div class="stub">
        <div class="qr">${qrs[i]}</div>
        <div class="k light">Siège</div>
        <div class="seat">${esc(t.seatLabel)}</div>
        <div class="paid">${total}</div>
      </div>
      <span class="notch top"></span>
      <span class="notch bot"></span>
    </div>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #16266b; margin: 0; padding: 44px 40px; background: #ffffff; }
    .head { font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: #8a93b4; margin-bottom: 22px; }
    .head b { color: #16266b; }

    .ticket { position: relative; display: flex; background: #fff;
      border: 2px solid #16266b; border-radius: 12px; overflow: hidden; page-break-inside: avoid; }
    .main { flex: 1; padding: 18px 20px 16px; }
    .bar { display: flex; align-items: center; justify-content: space-between; }
    .coopwrap { display: flex; align-items: center; gap: 9px; }
    .logo { width: 30px; height: 30px; border-radius: 4px; border: 1px solid rgba(22,38,107,.12); object-fit: cover; }
    .logo.mono { display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; }
    .coop { font-size: 13px; font-weight: 700; letter-spacing: .02em; }
    .status { background: #62b22e; color: #fff; font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 4px; }
    .route { font-size: 26px; font-weight: 800; margin: 16px 0 14px; line-height: 1.05; }
    .arrow, .dest { color: #f5821f; }
    .arrow { margin: 0 8px; }
    .grid { display: flex; flex-wrap: wrap; gap: 12px 30px; }
    .cell .k { font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: #8a93b4; }
    .cell .v { font-size: 15px; font-weight: 600; margin-top: 2px; }
    .mono-txt, .code { font-family: ui-monospace, "SF Mono", Menlo, monospace; }
    .code { margin-top: 14px; font-size: 9px; color: #c2c8db; word-break: break-all; }

    .stub { width: 146px; flex-shrink: 0; border-left: 2px dashed #16266b; background: #f4f6fb;
      padding: 16px 12px; text-align: center; display: flex; flex-direction: column; align-items: center; }
    .qr { width: 96px; height: 96px; }
    .qr svg { width: 100%; height: 100%; }
    .stub .k.light { font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: #8a93b4; margin-top: 10px; }
    .seat { font-size: 34px; font-weight: 800; line-height: 1; margin-top: 2px; color: #16266b; }
    .paid { font-family: ui-monospace, monospace; font-size: 12px; color: #4a5680; margin-top: 8px; }

    /* Perforation punch holes, centered on the dashed line */
    .notch { position: absolute; right: 138px; width: 16px; height: 16px; background: #fff;
      border: 2px solid #16266b; border-radius: 50%; }
    .notch.top { top: -9px; }
    .notch.bot { bottom: -9px; }

    /* Scissors cut line between seat tickets */
    .cut { position: relative; height: 26px; margin: 6px 0; border-top: 2px dashed #b6bcd2; }
    .cut .scis { position: absolute; left: 8px; top: -13px; background: #fff; padding: 0 6px; color: #8a93b4; font-size: 18px; }

    .foot { margin-top: 18px; font-size: 11px; color: #8a93b4; }
  </style></head><body>
    <div class="head">Billet électronique &middot; <b>Cooperative+</b></div>
    ${tickets}
    <div class="foot">Présentez le QR code de ce billet au chauffeur à l'embarquement.</div>
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
