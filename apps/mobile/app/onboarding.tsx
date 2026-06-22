import { useRef, useState } from "react";
import { Dimensions, type NativeScrollEvent, type NativeSyntheticEvent, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight, Armchair, Bus, Wallet } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cn } from "@/lib/cn";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    Icon: Bus,
    tint: "#16266b",
    bg: "bg-navy/10",
    title: "Trouvez votre trajet",
    body: "Comparez les départs de toutes les coopératives de taxi-brousse, en quelques secondes.",
  },
  {
    Icon: Armchair,
    tint: "#f5821f",
    bg: "bg-laterite/12",
    title: "Choisissez votre siège",
    body: "Visualisez la disposition réelle du véhicule et réservez exactement la place que vous voulez.",
  },
  {
    Icon: Wallet,
    tint: "#62b22e",
    bg: "bg-baobab/12",
    title: "Payez & voyagez",
    body: "Réglez par Mobile Money et recevez votre billet électronique avec QR code. C'est tout.",
  },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);
  const last = index === SLIDES.length - 1;

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  }

  async function finish() {
    await AsyncStorage.setItem("onboarded", "1");
    router.replace("/");
  }

  function next() {
    if (last) finish();
    else ref.current?.scrollTo({ x: (index + 1) * width, animated: true });
  }

  return (
    <View className="flex-1 bg-sand" style={{ paddingTop: insets.top }}>
      <View className="flex-row justify-end px-5 py-2">
        <Pressable onPress={finish} className="rounded-[4px] px-3 py-1.5">
          <Text className="font-sans text-sm text-ink-soft/70">Passer</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={{ width }} className="flex-1 items-center justify-center px-10">
            <View className={cn("h-44 w-44 items-center justify-center rounded-[4px]", s.bg)}>
              <s.Icon size={72} color={s.tint} strokeWidth={1.5} />
            </View>
            <Text className="mt-12 text-center font-display text-3xl text-ink">{s.title}</Text>
            <Text className="mt-3 text-center font-sans text-base leading-6 text-ink-soft">{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="px-6" style={{ paddingBottom: insets.bottom + 20 }}>
        {/* Dots */}
        <View className="mb-6 flex-row justify-center gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={cn(
                "h-2 rounded-[4px]",
                i === index ? "w-6 bg-laterite" : "w-2 bg-ink/15",
              )}
            />
          ))}
        </View>

        <Pressable
          onPress={next}
          className="h-14 flex-row items-center justify-center gap-2 rounded-[4px] bg-laterite active:opacity-90"
        >
          <Text className="font-sans text-base font-medium text-paper">
            {last ? "Commencer" : "Suivant"}
          </Text>
          <ArrowRight size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
