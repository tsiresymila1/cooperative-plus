"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, AlertTriangle, QrCode, Armchair, MapPin } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { db, Card, fmtTime, fmtDate } from "@cp/ui";

type Result =
  | { tone: "success"; title: string; ticket: any }
  | { tone: "warning"; title: string; ticket?: any }
  | { tone: "error"; title: string };

/** Camera QR check-in. Scoped to a single trip when `tripId` is set. */
export function BoardingScanner({ coopId, tripId = "" }: { coopId: string; tripId?: string }) {
  const readerId = "qr-" + useId().replace(/[:]/g, "");
  const [result, setResult] = useState<Result | null>(null);
  const [scanning, setScanning] = useState(false);
  const busyRef = useRef(false);
  const lastRef = useRef<{ token: string; at: number }>({ token: "", at: 0 });

  async function handleToken(token: string) {
    const now = Date.now();
    if (busyRef.current) return;
    if (token === lastRef.current.token && now - lastRef.current.at < 3000) return;
    lastRef.current = { token, at: now };
    busyRef.current = true;
    try {
      const { data } = await db.queryOnce({
        tickets: { $: { where: { qrToken: token } }, cooperative: {}, tripInstance: {}, booking: {} },
      });
      const t: any = data?.tickets?.[0];
      if (!t) {
        setResult({ tone: "error", title: "Billet introuvable" });
      } else if (t.cooperative?.id !== coopId) {
        setResult({ tone: "error", title: "Billet d'une autre coopérative" });
      } else if (tripId && t.tripInstance?.id !== tripId) {
        setResult({ tone: "error", title: "Billet d'un autre trajet" });
      } else if (t.booking?.status === "cancelled") {
        setResult({ tone: "error", title: "Réservation annulée" });
      } else if (t.checkedInAt) {
        setResult({ tone: "warning", title: `Déjà enregistré à ${fmtTime(t.checkedInAt)}`, ticket: t });
      } else {
        await db.transact(db.tx.tickets[t.id].update({ checkedInAt: Date.now() }));
        try { (navigator as any).vibrate?.(60); } catch {}
        setResult({ tone: "success", title: "Passager enregistré", ticket: t });
      }
    } catch (e: any) {
      setResult({ tone: "error", title: "Erreur: " + (e?.message ?? "inconnue") });
    } finally {
      setTimeout(() => (busyRef.current = false), 800);
    }
  }

  useEffect(() => {
    let qr: Html5Qrcode | null = null;
    let cancelled = false;

    // Stop only when actually scanning/paused — stop() throws synchronously
    // otherwise ("scanner is not running"), and that throw escapes .catch().
    const stopSafe = async (inst: Html5Qrcode | null) => {
      if (!inst) return;
      try {
        const st = inst.getState?.(); // 2 = SCANNING, 3 = PAUSED
        if (st === 2 || st === 3) await inst.stop();
      } catch { /* already stopped */ }
      try { inst.clear(); } catch { /* ignore */ }
    };

    (async () => {
      try {
        qr = new Html5Qrcode(readerId, { verbose: false } as any);
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => handleToken(decoded.trim()),
          () => {},
        );
        if (cancelled) { await stopSafe(qr); return; }
        setScanning(true);
      } catch {
        if (!cancelled) setScanning(false);
      }
    })();

    return () => {
      cancelled = true;
      void stopSafe(qr);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tone = result?.tone;
  const card =
    tone === "success" ? "border-baobab/40 bg-baobab/10" :
    tone === "warning" ? "border-clay/40 bg-clay/10" :
    tone === "error" ? "border-laterite/40 bg-laterite/10" : "border-ink/10 bg-paper";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Camera */}
      <Card className="overflow-hidden p-0">
        <div id={readerId} className="aspect-square w-full bg-ink/90 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        <p className="px-4 py-3 text-center text-sm text-ink-soft/70">
          {scanning ? "Visez le QR code du billet" : "Autorisez l'accès à la caméra…"}
        </p>
      </Card>

      {/* Result */}
      <Card className={`border ${card} transition-colors`}>
        {!result ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-ink-soft/60">
            <QrCode size={40} />
            <p className="text-sm">En attente d'un scan…</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-2">
              {tone === "success" && <CheckCircle2 className="text-baobab" size={22} />}
              {tone === "warning" && <AlertTriangle className="text-clay" size={22} />}
              {tone === "error" && <XCircle className="text-laterite" size={22} />}
              <p className="text-lg font-bold text-ink">{result.title}</p>
            </div>
            {"ticket" in result && result.ticket && (
              <div className="mt-4 space-y-2 text-sm">
                <Row icon={<Armchair size={15} />} label="Siège" value={result.ticket.seatLabel} />
                <Row label="Passager" value={result.ticket.passengerName} />
                <Row icon={<MapPin size={15} />} label="Trajet"
                  value={`${result.ticket.tripInstance?.originName ?? "—"} → ${result.ticket.tripInstance?.destName ?? "—"}`} />
                {result.ticket.tripInstance && (
                  <Row label="Départ" value={`${fmtDate(result.ticket.tripInstance.departDate)} · ${fmtTime(result.ticket.tripInstance.departureAt)}`} />
                )}
                <Row label="Référence" value={result.ticket.booking?.reference ?? "—"} mono />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ icon, label, value, mono }: { icon?: ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink/[.06] pb-2 last:border-0">
      <span className="flex items-center gap-1.5 text-ink-soft/60">{icon}{label}</span>
      <span className={`text-right font-medium text-ink ${mono ? "font-mono text-[13px]" : ""}`}>{value}</span>
    </div>
  );
}
