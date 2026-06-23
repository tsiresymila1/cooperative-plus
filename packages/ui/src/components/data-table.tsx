"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, Skeleton } from "./ui";
import { cn } from "../lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty = "Aucun résultat.",
  onRowClick,
  loading,
  pageSize = 10,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = pageSize > 0 ? rows.slice(safePage * pageSize, safePage * pageSize + pageSize) : rows;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink/[.02] text-left text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft/55">
            <tr className="border-b border-ink/8">
              {columns.map((c) => (
                <th key={c.key} className={cn("px-5 py-3.5", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-ink/5 last:border-0">
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-4">
                      <Skeleton className="h-4 w-full max-w-[8rem]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-ink-soft/60">
                  {empty}
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "group border-b border-ink/[.06] transition-colors last:border-0 hover:bg-ink/[.03]",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-5 py-3.5", c.className)}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && rows.length > pageSize && (
        <div className="flex items-center justify-between border-t border-ink/8 px-5 py-3 text-sm text-ink-soft">
          <span>{safePage * pageSize + 1}–{Math.min(rows.length, (safePage + 1) * pageSize)} sur {rows.length}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}
              className="grid h-8 w-8 place-items-center rounded-[--radius] hover:bg-ink/5 disabled:opacity-40"><ChevronLeft size={16} /></button>
            <span className="px-2 font-medium text-ink">{safePage + 1} / {pageCount}</span>
            <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={safePage >= pageCount - 1}
              className="grid h-8 w-8 place-items-center rounded-[--radius] hover:bg-ink/5 disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </Card>
  );
}

/** Toolbar wrapper for filters above a table. */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}
