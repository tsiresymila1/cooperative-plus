import { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cn } from "@/lib/cn";

const { width, height } = Dimensions.get("window");
const HERO_H = Math.round(height * 0.5);

const SLIDES = [
  {
    title: "Voyagez en toute simplicité",
    body: "Réservez votre place de taxi-brousse en quelques secondes, partout à Madagascar.",
  },
  {
    title: "Choisissez votre siège",
    body: "Visualisez la disposition réelle du véhicule et sélectionnez exactement la place que vous voulez.",
  },
  {
    title: "Payez & embarquez",
    body: "Mobile Money et billet électronique avec QR code. Présentez-le simplement au chauffeur.",
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
    <View className="flex-1 bg-sand">
      {/* Hero image with fade */}
      <View style={{ height: HERO_H }} className="w-full">
        <Image
          source={require("../assets/onboarding-bus.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["rgba(248,250,252,0)", "rgba(248,250,252,0.2)", "#f8fafc"]}
          locations={[0, 0.6, 1]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: HERO_H }}
          pointerEvents="none"
        />
        {/* Skip */}
        <Pressable onPress={finish} style={{ position: "absolute", right: 16, top: insets.top + 6 }} className="rounded-[4px] bg-paper/70 px-3 py-1.5">
          <Text className="font-sans text-sm font-medium text-ink">Passer</Text>
        </Pressable>
        {/* Brand */}
        <View className="absolute inset-x-0 bottom-2 flex-row items-center justify-center gap-2">
          <Image source={require("../assets/logo-long.png")} style={{ width: 180, height: 100, borderRadius: 6 }} resizeMode="contain" />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 justify-between">
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={{ width }} className="items-center px-8 pt-6">
              <Text className="text-center font-display text-3xl leading-tight text-ink">{s.title}</Text>
              <Text className="mt-3 text-center font-sans text-base leading-6 text-ink-soft">{s.body}</Text>
            </View>
          ))}
        </ScrollView>

        <View className="px-6" style={{ paddingBottom: insets.bottom + 20 }}>
          {/* Dots */}
          <View className="mb-6 flex-row justify-center gap-2">
            {SLIDES.map((_, i) => (
              <View key={i} className={cn("h-2 rounded-[4px]", i === index ? "w-6 bg-laterite" : "w-2 bg-ink/15")} />
            ))}
          </View>

          <Pressable
            onPress={next}
            className="h-14 flex-row items-center justify-center gap-2 rounded-[4px] bg-laterite active:opacity-90"
          >
            <Text className="font-sans text-base font-medium text-paper">{last ? "Commencer" : "Suivant"}</Text>
            <ArrowRight size={18} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
