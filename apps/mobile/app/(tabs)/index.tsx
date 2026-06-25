import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronRight, Moon, Search, Sun, User as UserIcon } from "lucide-react-native";
import { Button, Card } from "@/components/ui";
import { DateField, DestinationField, type Dest } from "@/components/picker";
import { useColors } from "@/lib/colors";
import { cn, fmtMoney } from "@/lib/cn";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { fmtTime, toDateKey, toMs } from "@/lib/domain";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const c = useColors();
  const { colorScheme, setColorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  function toggleTheme() {
    const next = dark ? "light" : "dark";
    setColorScheme(next);
    AsyncStorage.setItem("cp-theme", next).catch(() => {});
  }

  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [date, setDate] = useState(() => new Date());

  const dateKey = toDateKey(date);

  // Destination pool for the select fields.
  const { data: destData } = db.useQuery({
    destinations: {
      $: { where: { or: [{ isPopular: true }, { isGlobal: true }] }, limit: 50 },
    },
  });
  const allDests: Dest[] = (destData?.destinations ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    region: d.region ?? undefined,
  }));

  // Next departures: fetch upcoming scheduled trips, then filter out any whose
  // departure time has already passed (server date-filter is unreliable on the
  // `date` field type, so we compare client-side like the search results do).
  const today = toDateKey(new Date());
  const { data: popularData } = db.useQuery({
    tripInstances: {
      $: { where: { status: "scheduled", departDate: { $gte: today } }, limit: 100, order: { departureAt: "asc" } },
      tickets: {},
      cooperative: {},
      tag:{}
    },
  });

  const popular = (popularData?.tripInstances ?? [])
    .filter((t) => toMs(t.departureAt) > Date.now())
    .slice(0, 3);

  const [tried, setTried] = useState(false);
  const [searching, setSearching] = useState(false);
  const originErr = tried && !origin.trim() ? "Choisissez une ville de départ" : undefined;
  const destErr = tried && !dest.trim() ? "Choisissez une ville d'arrivée" : undefined;
  const sameErr = tried && origin.trim() && dest.trim() && origin.trim() === dest.trim()
    ? "Départ et arrivée identiques"
    : undefined;

  function goSearch() {
    setTried(true);
    if (!origin.trim() || !dest.trim() || origin.trim() === dest.trim()) return;
    setSearching(true);
    // Brief spinner before landing on the results page.
    setTimeout(() => {
      router.push({
        pathname: "/results",
        params: { origin: origin.trim(), dest: dest.trim(), date: dateKey },
      });
      setSearching(false);
    }, 350);
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="h-full w-full" >
      <View className="w-full h-full">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} className="flex-row items-center justify-between pr-5 py-4">
          <View className="flex-row items-center gap-2">
            <Image source={require("../../assets/logo-long.png")} style={{ width: 170, height: 40, borderRadius: 8 }} resizeMode="contain" />
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={toggleTheme}
              className="h-9 w-9 items-center justify-center rounded-[4px] border border-ink/10 bg-paper"
            >
              {dark ? <Sun size={18} color={c.laterite} /> : <Moon size={18} color={c.ink} />}
            </Pressable>
            <Pressable
              onPress={() => router.push(user ? "/profile" : "/sign-in")}
              className="h-9 w-9 items-center justify-center rounded-[4px] border border-ink/10 bg-paper"
            >
              <UserIcon size={18} color={c.ink} />
            </Pressable>
          </View>
        </Animated.View>
        <ScrollView
          className="flex-1 bg-sand"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 6, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <Animated.View entering={FadeInDown.delay(80).duration(420)} className="px-5 pt-6">
            <Text className="font-sans text-sm text-ink-soft/70">
              {user?.email ? `Bonjour, ${user.email.split("@")[0]} 👋` : "Bonjour 👋"}
            </Text>
            <Text className="mt-1 font-display text-3xl text-ink">Où allez-vous ?</Text>
          </Animated.View>

          {/* Search card — primary focus, gets the most space */}
          <Animated.View entering={FadeInDown.delay(160).duration(420)} className="px-5 pt-15">
            <Card className="gap-4 p-5 shadow-lg">
              <DestinationField
                label="Départ"
                value={origin}
                placeholder="Ville de départ"
                options={allDests}
                onSelect={(v) => { setOrigin(v); setTried(false); }}
                tint={c.ink}
                error={originErr}
              />
              <View className="h-px bg-ink/8" />
              <DestinationField
                label="Arrivée"
                value={dest}
                placeholder="Ville d'arrivée"
                options={allDests}
                onSelect={(v) => { setDest(v); setTried(false); }}
                tint={c.laterite}
                error={destErr}
              />

              <DateField value={date} onChange={setDate} />

              {sameErr ? <Text className="font-sans text-xs text-laterite-deep">{sameErr}</Text> : null}

              <Button size="lg" className="mt-1" onPress={goSearch} loading={searching}>
                {!searching && <Search size={18} color="#ffffff" />}
                <Text className="font-sans text-base font-medium text-white">Rechercher</Text>
              </Button>
            </Card>
          </Animated.View>

          {/* Prochains départs — secondary, kept compact */}
          <View className="px-5 pt-15">
            <Text className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-soft/60">
              Prochains départs
            </Text>
            {popular.length === 0 ? (
              <Text className="mt-3 font-sans text-sm text-ink-soft/70">Aucun départ programmé pour le moment.</Text>
            ) : (
              popular.map((r, i) => {
                const booked = r.tickets?.length ?? 0;
                const full = booked >= r.seatsTotal;
                return (
                  <Animated.View key={r.id} entering={FadeInDown.delay(220 + i * 60).duration(380)}>
                    <Pressable
                      disabled={full}
                      onPress={() => router.push({ pathname: "/trip/[id]", params: { id: r.id } })}
                      className="flex-row items-center gap-3 border-b border-ink/8 py-3.5 active:opacity-70"
                    >
                      <Text className={cn("w-14 font-mono text-base", full ? "text-ink-soft/50" : "text-ink")}>
                        {fmtTime(r.departureAt)}
                      </Text>
                      <View className="flex-1">
                        <Text className="font-sans text-[15px] text-ink" numberOfLines={1}>
                          {r.originName} <Text className="text-ink-soft/50">→</Text> {r.destName}
                        </Text>
                        <Text className="mt-0.5 font-mono text-[11px] text-ink-soft/60" numberOfLines={1}>
                          {r.coopName} · {full ? "Complet" : `${r.seatsTotal - booked} places`}
                        </Text>
                      </View>
                      <Text className="font-mono text-sm text-ink">{fmtMoney(r.price, r.currency)}</Text>
                      <ChevronRight size={18} color={c.inkSoft} />
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>

  );
}
