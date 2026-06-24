import { useMemo } from "react";
import { Text, View } from "react-native";
import { CircleDot, DoorOpen, User } from "lucide-react-native";
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
      <View className="items-center gap-3">
        {Array.from({ length: maxRow + 1 }, (_, r) => (
          <View key={r} className="flex-row justify-between gap-3">
            {Array.from({ length: maxCol + 1 }, (_, col) => {
              const cell = at(r, col);
              if (cell?.type === "driver") {
                return (
                  <View key={col} className="h-14 w-14 items-center justify-center rounded-[4px] border border-ink/15 bg-ink/5">
                    <CircleDot size={16} color="#4a5680" />
                  </View>
                );
              }
              if (cell?.type === "door") {
                return (
                  <View key={col} className="h-14 w-14 items-center justify-center rounded-[4px] border border-dashed border-ink/20">
                    <DoorOpen size={16} color="#4a568088" />
                  </View>
                );
              }
              if (!cell || cell.type !== "seat") {
                return <View key={col} className="h-14 w-14" />;
              }
              seatIdx += 1;
              const label = seatLabel(cell, seatIdx);
              const isMine = mine.has(label);
              const isTaken = occupied.has(label) && !isMine;
              return (
                <View
                  key={col}
                  className={cn(
                    "h-14 w-14 items-center justify-center rounded-[4px] border",
                    isMine
                      ? "border-laterite bg-laterite"
                      : isTaken
                        ? "border-red-600 bg-red-600"
                        : "border-ink/15 bg-paper",
                  )}
                >
                  {isTaken ? (
                    <User size={16} color="#ffffff" />
                  ) : (
                    <Text
                      className={cn(
                        "font-mono text-xs font-semibold",
                        isMine ? "text-paper" : "text-ink",
                      )}
                    >
                      {label}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View className="mt-4 flex-row justify-center gap-4">
        <Legend className="border-laterite bg-laterite" label="vos sièges" />
        <Legend className="border-red-600 bg-red-600" label="occupé" />
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
