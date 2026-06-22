import * as Print from "expo-print";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { fmtMoney } from "./cn";
import { bookingStatusFr, fmtDateKey, fmtTime } from "./domain";

type TicketLike = { seatLabel: string; passengerName?: string | null; qrToken: string };
type Args = {
  reference: string;
  status: string;
  coopName?: string | null;
  originName?: string | null;
  destName?: string | null;
  departDate?: string | null;
  departureAt?: number | string | null;
  totalAmount: number;
  currency: string;
  tickets: TicketLike[];
};

const esc = (s: unknown) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));

function html(a: Args): string {
  const { label } = bookingStatusFr(a.status);
  const when = `${a.departDate ? fmtDateKey(a.departDate) : ""}${a.departureAt ? ` · ${fmtTime(a.departureAt)}` : ""}`;
  const rows = a.tickets
    .map(
      (t) => `
      <div class="ticket">
        <div class="seat">Siège ${esc(t.seatLabel)}</div>
        <div class="muted">${esc(t.passengerName || "—")}</div>
        <div class="code">${esc(t.qrToken)}</div>
      </div>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #16266b; margin: 0; padding: 32px; }
    .tag { display: inline-block; background: #16266b; color: #fff; padding: 5px 12px; border-radius: 4px; font-size: 12px; letter-spacing: .04em; }
    .status { display: inline-block; margin-left: 8px; background: #62b22e; color: #fff; padding: 5px 12px; border-radius: 4px; font-size: 12px; }
    .route { font-size: 30px; font-weight: 800; margin: 16px 0 4px; }
    .orange { color: #f5821f; }
    .muted { color: #4a5680; }
    .ref { margin-top: 4px; font-family: monospace; font-size: 13px; }
    hr { border: none; border-top: 1px dashed #dfe4ef; margin: 20px 0; }
    .ticket { border: 1px solid #dfe4ef; border-radius: 4px; padding: 16px; margin-top: 12px; }
    .seat { font-size: 18px; font-weight: 700; }
    .code { font-family: monospace; font-size: 11px; color: #8a93b4; margin-top: 6px; word-break: break-all; }
    .total { margin-top: 20px; font-size: 18px; }
    .foot { margin-top: 36px; font-size: 11px; color: #8a93b4; }
  </style></head><body>
    <span class="tag">${esc(a.coopName)}</span><span class="status">${esc(label)}</span>
    <div class="route">${esc(a.originName)} &rarr; <span class="orange">${esc(a.destName)}</span></div>
    <div class="muted">${esc(when)}</div>
    <div class="ref">Réf. ${esc(a.reference)}</div>
    <hr />
    <div class="muted" style="font-weight:600">${a.tickets.length > 1 ? "Billets" : "Billet"}</div>
    ${rows}
    <hr />
    <div class="total">Total payé : <b>${esc(fmtMoney(a.totalAmount, a.currency))}</b></div>
    <div class="foot">Cooperative Plus — billet électronique. Présentez ce billet au chauffeur.</div>
  </body></html>`;
}

/** Generate a PDF and open the share/save sheet. */
export async function shareTicketPdf(a: Args): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: html(a) });
  if (await isAvailableAsync()) {
    await shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Billet Cooperative Plus", UTI: "com.adobe.pdf" });
  }
}

/** Open the native print dialog. */
export async function printTicket(a: Args): Promise<void> {
  await Print.printAsync({ html: html(a) });
}
