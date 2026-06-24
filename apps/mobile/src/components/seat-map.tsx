import { useMemo } from "react";
import { Text, View } from "react-native";
import { CircleDot, DoorOpen } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { seatLabel, type SeatCell } from "@/lib/domain";

/**
 * Read-only vehicle seat map. Highlights the rider's own seats (`mine`) and
 * shows other occupied seats greyed out. Renders by absolute row/col so the
 * aisle / driver line up exactly like the cooperative's layout.
 */
export function SeatMapView({
  cells,
  occupied,
  mine,
}: {
  cells: SeatCell[];
  occupied: Set<string>;
  mine: Set<string>;
}) {
  const { maxRow, maxCol, at } = useMemo(() => {
    const map = new Map<string, SeatCell>();
    let mr = 0;
    let mc = 0;
    for (const cc of cells) {
      mr = Math.max(mr, cc.row);
      mc = Math.max(mc, cc.col);
      map.set(`${cc.row}:${cc.col}`, cc);
    }
    return { maxRow: mr, maxCol: mc, at: (r: number, col: number) => map.get(`${r}:${col}`) };
  }, [cells]);

  let seatIdx = -1;
  return (
    <View className="rounded-[4px] border border-ink/10 bg-sand-deep/40 p-4">
      <Text className="mb-3 text-center font-mono text-[10px] uppercase tracking-widest text-ink-soft/55">
        ↑ avant du véhicule
      </Text>
      <View className="gap-2 justify-center items-center">
        {Array.from({ length: maxRow + 1 }, (_, r) => (
          <View key={r} className="flex-row gap-2">
            {Array.from({ length: maxCol + 1 }, (_, col) => {
              const cell = at(r, col);
              if (cell?.type === "driver") {
                return (
                  <View key={col} className="h-10 w-10 items-center justify-center rounded-[4px] bg-ink/5">
                    <CircleDot size={16} color="#94a3b8" />
                  </View>
                );
              }
              if (cell?.type === "door") {
                return (
                  <View key={col} className="h-10 w-10 items-center justify-center rounded-[4px] border border-dashed border-ink/20">
                    <DoorOpen size={16} color="#94a3b8" />
                  </View>
                );
              }
              if (!cell || cell.type !== "seat") {
                return <View key={col} className="h-10 w-10" />;
              }
              seatIdx += 1;
              const label = seatLabel(cell, seatIdx);
              const isMine = mine.has(label);
              const isTaken = occupied.has(label) && !isMine;
              return (
                <View
                  key={col}
                  className={cn(
                    "h-10 w-10 items-center justify-center rounded-[4px] border",
                    isMine
                      ? "border-laterite bg-laterite"
                      : isTaken
                        ? "border-ink/10 bg-ink/10"
                        : "border-ink/15 bg-paper",
                  )}
                >
                  <Text
                    className={cn(
                      "font-mono text-xs font-semibold",
                      isMine ? "text-paper" : isTaken ? "text-ink-soft/40 line-through" : "text-ink",
                    )}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View className="mt-4 flex-row justify-center gap-4">
        <Legend className="border-laterite bg-laterite" label="vos sièges" />
        <Legend className="border-ink/10 bg-ink/10" label="occupé" />
        <Legend className="border-ink/15 bg-paper" label="libre" />
      </View>
    </View>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={cn("h-4 w-4 rounded-full border", className)} />
      <Text className="font-sans text-xs text-ink-soft">{label}</Text>
    </View>
  );
}
