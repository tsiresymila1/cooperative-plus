import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { toDateKey } from "@/lib/domain";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

/** Themed month calendar. Disables dates before `min` (default today). */
export function Calendar({
  value,
  onSelect,
  min,
}: {
  value: Date;
  onSelect: (d: Date) => void;
  min?: Date;
}) {
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const minKey = toDateKey(min ?? new Date());
  const selKey = toDateKey(value);

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    // Monday-first offset (JS: 0=Sun).
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
    return out;
  }, [view]);

  function shiftMonth(delta: number) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  return (
    <View>
      {/* Month header */}
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => shiftMonth(-1)} className="h-9 w-9 items-center justify-center rounded-[4px] bg-sand">
          <ChevronLeft size={18} color="#16266b" />
        </Pressable>
        <Text className="font-display text-base text-ink">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </Text>
        <Pressable onPress={() => shiftMonth(1)} className="h-9 w-9 items-center justify-center rounded-[4px] bg-sand">
          <ChevronRight size={18} color="#16266b" />
        </Pressable>
      </View>

      {/* Weekday row */}
      <View className="mt-3 flex-row">
        {WEEKDAYS.map((w, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="font-mono text-[11px] text-ink-soft/50">{w}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View className="mt-1 flex-row flex-wrap">
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={{ width: `${100 / 7}%` }} className="aspect-square" />;
          const key = toDateKey(d);
          const disabled = key < minKey;
          const selected = key === selKey;
          return (
            <View key={i} style={{ width: `${100 / 7}%` }} className="aspect-square p-0.5">
              <Pressable
                disabled={disabled}
                onPress={() => onSelect(d)}
                className={cn(
                  "flex-1 items-center justify-center rounded-[4px]",
                  selected ? "bg-laterite" : "bg-transparent",
                )}
              >
                <Text
                  className={cn(
                    "font-sans text-sm",
                    selected ? "text-paper" : disabled ? "text-ink-soft/25" : "text-ink",
                  )}
                >
                  {d.getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
