import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  MapPin,
  Search,
} from "lucide-react-native";
import { cn } from "@/lib/cn";
import { fmtDateKey, toDateKey } from "@/lib/domain";
import { Calendar } from "@/components/calendar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type Dest = { id: string; name: string; region?: string };

/** Tap-to-select field: opens a searchable destination bottom sheet (gorhom). */
export function DestinationField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  tint = "#16266b",
  error,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Dest[];
  onSelect: (name: string) => void;
  tint?: string;
  error?: string;
}) {
  const ref = useRef<BottomSheetModal>(null);
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (
      t ? options.filter((d) => d.name.toLowerCase().includes(t)) : options
    ).slice(0, 60);
  }, [term, options]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
      />
    ),
    [],
  );



  function pick(name: string) {
    onSelect(name);
    setTerm("");
    ref.current?.dismiss();
  }

  return (
    <>
      <Pressable onPress={() => ref.current?.present()}>
        <Text className={cn("text-[10px] font-medium uppercase tracking-widest", error ? "text-laterite-deep" : "text-ink-soft/60")}>
          {label}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <MapPin size={18} color={error ? "#d96d0f" : tint} />
          <Text
            className={cn(
              "flex-1 font-sans text-base",
              value ? "text-ink" : error ? "text-laterite-deep/70" : "text-ink-soft/45",
            )}
          >
            {value || placeholder}
          </Text>
          <ChevronDown size={18} color="#4a5680" />
        </View>
        {error ? <Text className="mt-1 font-sans text-xs text-laterite-deep">{error}</Text> : null}
      </Pressable>

      <BottomSheetModal
        ref={ref}
        snapPoints={["50%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#ffffff", borderRadius: 4 }}
        handleIndicatorStyle={{ backgroundColor: "rgba(22,38,107,0.18)" }}
        enableDynamicSizing={false}
      >
        <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: 8, backgroundColor: "white", position: "relative", zIndex: 1000 }}>
          <Text className="font-display text-xl text-ink">{label}</Text>
          <View className="mt-3 flex-row items-center gap-2 rounded-[4px] border border-ink/10 bg-sand px-3">
            <Search size={16} color="#4a5680" />
            <BottomSheetTextInput
              value={term}
              onChangeText={setTerm}
              placeholder="Rechercher une ville"
              placeholderTextColor="#4a568066"
              style={{
                flex: 1,
                paddingVertical: 12,
                fontSize: 16,
                color: "#16266b",
                fontFamily: "Manrope_500Medium",
              }}
            />
          </View>

        </BottomSheetView>

        <BottomSheetScrollView
          contentContainerStyle={{
            paddingTop: 100,
            paddingBottom: 32,
            paddingHorizontal: 16
          }}
          keyboardShouldPersistTaps="handled"
        >

          {filtered.length === 0 ? (
            <Text className="px-3 py-6 text-center font-sans text-sm text-ink-soft/60">
              Aucune ville trouvée.
            </Text>
          ) : (
            filtered.map((d) => {
              const active = d.name === value;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => pick(d.name)}
                  className={cn(
                    "flex-row items-center gap-3 rounded-[4px] px-2 py-3",
                    active && "bg-laterite/10",
                  )}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-[4px] bg-sand">
                    <MapPin size={16} color={active ? "#f5821f" : "#16266b"} />
                  </View>
                  <Text className="flex-1 font-sans text-base text-ink">
                    {d.name}
                  </Text>
                  {d.region ? (
                    <Text className="font-mono text-xs text-ink-soft/50">
                      {d.region}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}

/** Tap-to-pick date field backed by a themed in-app calendar dialog. */
export function DateField({
  value,
  onChange,
  className,
}: {
  value: Date;
  onChange: (d: Date) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className={className}>
      <Text className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/60">
        Date
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="mt-1 flex-row items-center gap-2"
      >
        <CalendarIcon size={16} color="#16266b" />
        <Text className="font-sans text-base text-ink">
          {fmtDateKey(toDateKey(value))}
        </Text>
      </Pressable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showClose={false} className="gap-4">
          <DialogTitle className="font-display text-lg text-ink">
            Choisir une date
          </DialogTitle>
          <Calendar
            value={value}
            onSelect={(d) => {
              onChange(d);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </View>
  );
}
