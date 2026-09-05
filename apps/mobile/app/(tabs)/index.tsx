import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowRight, Clock, Moon, Search, Sun, User as UserIcon } from "lucide-react-native";
import { Badge, Button, Card } from "@/components/ui";
import { DateField, DestinationField, type Dest } from "@/components/picker";
import { CoopLogo } from "@/components/coop-logo";
import { TagBadge } from "@/components/tag-badge";
import { useColors } from "@/lib/colors";
import { cn, fmtMoney } from "@/lib/cn";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { fmtDateKey, fmtTime, toDateKey, toMs } from "@/lib/domain";

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
    <SafeAreaView edges={['bottom']} className="h-full w-full" >
      <View className="w-full h-full bg-sand">
        {/* Navy header band */}
        <Animated.View
          entering={FadeIn.duration(500)}
          className="rounded-b-[20px] bg-strong px-5 pb-7"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-center justify-between">
            <Image source={require("../../assets/logo-long.png")} style={{ width: 170, height: 40, borderRadius: 8 }} resizeMode="contain" />
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={toggleTheme}
                className="h-9 w-9 items-center justify-center rounded-[4px] bg-white/15"
              >
                {dark ? <Sun size={18} color="#ffffff" /> : <Moon size={18} color="#ffffff" />}
              </Pressable>
              <Pressable
                onPress={() => router.push(user ? "/profile" : "/sign-in")}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/15"
              >
                <UserIcon size={18} color="#ffffff" />
              </Pressable>
            </View>
          </View>

          {/* Greeting + title */}
          <Animated.View entering={FadeInDown.delay(80).duration(420)} className="mt-6">
            <Text className="font-sans text-sm text-white/70">
              {user?.email ? `Bonjour, ${user.email.split("@")[0]} 👋` : "Bonjour 👋"}
            </Text>
            <Text className="mt-1 font-display text-3xl uppercase tracking-wide text-white">
              Où allez-vous ?
            </Text>
          </Animated.View>
        </Animated.View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Search card — primary focus, gets the most space */}
          <Animated.View entering={FadeInDown.delay(160).duration(420)} className="px-5">
            <Card className="gap-6 p-5 shadow-lg">
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
              <DateField value={date} onChange={setDate} className="py-2" />
              <View className="h-px bg-ink/8" />
              {sameErr ? <Text className="font-sans text-xs text-laterite-deep">{sameErr}</Text> : null}
              <Button size="md" className="mt-1 w-full" onPress={goSearch} loading={searching}>
                {!searching && <Search size={18} color="#ffffff" />}
                <Text className="font-sans text-base font-semibold uppercase tracking-wide text-white">Rechercher</Text>
              </Button>
            </Card>
          </Animated.View>

          {/* Prochains départs — secondary, kept compact */}
          <View className="px-5 pt-8">
            <Text className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-soft/60">
              Prochains départs
            </Text>
            {popular.length === 0 ? (
              <Text className="mt-3 font-sans text-sm text-ink-soft/70">Aucun départ programmé pour le moment.</Text>
            ) : (
              <View className="mt-2 gap-2.5">
                {popular.map((r, i) => {
                  const booked = r.tickets?.length ?? 0;
                  const full = booked >= r.seatsTotal;
                  return (
                    <Animated.View key={r.id} entering={FadeInDown.delay(220 + i * 60).duration(380)}>
                      <Pressable
                        disabled={full}
                        onPress={() => router.push({ pathname: "/trip/[id]", params: { id: r.id } })}
                        className={cn(
                          "rounded-[4px] border border-ink/8 bg-paper p-3.5 active:opacity-80",
                          full && "opacity-60",
                        )}
                      >
                        {/* Coop + tag */}
                        <View className="flex-row items-center gap-3">
                          <CoopLogo url={r.cooperative?.logoUrl} brandColor={r.cooperative?.brandColor} name={r.coopName} size={30} />
                          <View className="flex-1 gap-1">
                            <Text className="font-sans text-sm font-bold text-laterite" numberOfLines={1}>{r.coopName}</Text>
                            <Text className="font-mono text-xs font-bold text-ink-soft/70" numberOfLines={1}>{r.vehicleName}</Text>
                          </View>
                          {r.tag ? <TagBadge name={r.tag.name} color={r.tag.color} /> : null}
                        </View>

                        {/* Route */}
                        <View className="mt-2.5 flex-row items-center gap-2">
                          <Text className="font-display text-lg text-ink" numberOfLines={1}>{r.originName}</Text>
                          <ArrowRight size={15} color="#D9A441" />
                          <Text className="flex-1 font-display text-lg text-laterite" numberOfLines={1}>{r.destName}</Text>
                          <Text className="font-mono text-sm font-bold text-green">{fmtMoney(r.price, r.currency)}</Text>
                        </View>

                        {/* Date · time + seats */}
                        <View className="mt-2.5 flex-row items-center justify-between">
                          <View className="flex-row items-center gap-1.5">
                            <Clock size={13} color={c.inkSoft} />
                            <Text className="font-mono text-[11px] text-ink-soft/70">
                              {fmtDateKey(r.departDate)} · {fmtTime(r.departureAt)}
                            </Text>
                          </View>
                          <Badge
                            tone={full ? "danger" : booked / r.seatsTotal >= 0.8 ? "warning" : "success"}
                            label={full ? "Complet" : `${r.seatsTotal - booked}/${r.seatsTotal} places`}
                          />
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>

  );
}
