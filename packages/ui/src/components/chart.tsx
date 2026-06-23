"use client";
import { useId } from "react";
import { Card } from "./ui";
import { cn } from "../lib/cn";

const VW = 800, VH = 200, PAD = 12;

function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Smooth SVG area chart (laterite). Pure SVG, no deps. */
export function AreaChart({ data, labels, height = 240, className }: {
  data: number[]; labels?: string[]; height?: number; className?: string;
}) {
  const gid = useId();
  const max = Math.max(1, ...data);
  const n = data.length;
  const x = (i: number) => (n <= 1 ? VW / 2 : (i / (n - 1)) * VW);
  const y = (v: number) => VH - PAD - (v / max) * (VH - PAD * 2);
  const pts = data.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L ${VW} ${VH} L 0 ${VH} Z` : "";
  const peak = data.indexOf(Math.max(...data));

  return (
    <div className={className}>
      <div style={{ height }} className="relative w-full">
        <svg className="h-full w-full" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-laterite)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-laterite)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {area && <path d={area} fill={`url(#${gid})`} />}
          {line && <path d={line} fill="none" stroke="var(--color-laterite)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          {peak >= 0 && data.length > 0 && (
            <circle cx={x(peak)} cy={y(data[peak]!)} r="5" fill="var(--color-laterite)" stroke="white" strokeWidth="2.5" />
          )}
        </svg>
      </div>
      {labels && (
        <div className="mt-3 flex justify-between font-mono text-[11px] uppercase tracking-tight text-ink-soft/60">
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

/** Tiny inline sparkline for KPI cards. */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(1, ...data);
  const n = data.length;
  const pts = data.map((v, i) => [n <= 1 ? 0 : (i / (n - 1)) * 100, 36 - (v / max) * 32] as [number, number]);
  return (
    <svg viewBox="0 0 100 40" className={cn("h-8 w-16", className)} preserveAspectRatio="none">
      <path d={smoothPath(pts)} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Horizontal bar list (e.g. revenue by route). */
export function BarList({ items, format }: {
  items: { label: string; value: number; sub?: string }[]; format?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-4">
      {items.length === 0 && <p className="text-sm text-ink-soft/60">Aucune donnée.</p>}
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-ink">{it.label}{it.sub && <span className="ml-1.5 text-xs text-ink-soft/60">{it.sub}</span>}</span>
            <span className="shrink-0 font-semibold text-ink tabular-nums">{format ? format(it.value) : it.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/[.06]">
            <div className="h-full rounded-full bg-strong transition-[width] duration-700" style={{ width: `${Math.max(3, (it.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Donut chart with center label + legend. */
export function Donut({ segments, centerValue, centerLabel, size = 168 }: {
  segments: { label: string; value: number; color: string }[];
  centerValue?: string; centerLabel?: string; size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 60, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle cx="80" cy="80" r={R} fill="none" stroke="var(--color-ink)" strokeOpacity="0.06" strokeWidth="20" />
          {segments.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle key={s.label} cx="80" cy="80" r={R} fill="none" stroke={s.color} strokeWidth="20"
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} strokeLinecap="butt" />
            );
            offset += len;
            return el;
          })}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="font-display text-2xl font-extrabold text-ink">{centerValue}</span>}
            {centerLabel && <span className="text-[10px] font-bold uppercase tracking-wide text-ink-soft/55">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-1">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label} <span className="font-semibold text-ink">{Math.round((s.value / total) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** KPI card matching the dashboard spec: label, big value, then a footer of
 * either { progress bar } | { trend pill + sparkline } | { custom pill + icon }. */
export function KpiCard({ label, value, valueSub, trend, trendDir, spark, progress, pill, icon }: {
  label: string; value: string; valueSub?: string;
  trend?: string; trendDir?: "up" | "down"; spark?: number[];
  progress?: number; pill?: { text: string; tone?: "warning" | "neutral" }; icon?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col justify-between p-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft/70">{label}</p>
        <p className="mt-1 font-display text-[1.85rem] font-extrabold leading-none text-ink tabular-nums">
          {value}{valueSub && <span className="ml-1 text-base font-normal text-ink-soft/70">{valueSub}</span>}
        </p>
      </div>

      {progress != null ? (
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink/[.06]">
          <div className="h-full rounded-full bg-laterite transition-[width] duration-700" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between">
          {trend ? (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold",
              trendDir === "down" ? "bg-danger/10 text-danger" : "bg-success/12 text-success")}>
              {trendDir === "down" ? "↓" : "↑"} {trend}
            </span>
          ) : pill ? (
            <span className={cn("rounded-full px-2 py-1 text-xs font-bold",
              pill.tone === "warning" ? "bg-warning/12 text-[#b45309]" : "bg-ink/[.06] text-ink-soft")}>
              {pill.text}
            </span>
          ) : <span />}
          {spark ? <span className="text-laterite opacity-50"><Sparkline data={spark} /></span>
            : icon ? <span className="text-ink-soft/60">{icon}</span> : null}
        </div>
      )}
    </Card>
  );
}
