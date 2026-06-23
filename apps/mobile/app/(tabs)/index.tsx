import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { ArrowRight, Clock, Search, User as UserIcon } from "lucide-react-native";
import { Badge, Button, Card } from "@/components/ui";
import { DateField, DestinationField, type Dest } from "@/components/picker";
import { CoopLogo } from "@/components/coop-logo";
import { fmtMoney } from "@/lib/cn";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { fmtDateKey, fmtTime, toDateKey, toMs } from "@/lib/domain";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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
      $: { where: { status: "scheduled", departDate: { $gte: today } }, limit: 20, order: { departureAt: "asc" } },
      tickets: {},
      cooperative: {},
    },
  });
  const popular = (popularData?.tripInstances ?? [])
    .filter((t) => toMs(t.departureAt) > Date.now())
    .slice(0, 4);

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
    <SafeAreaView className="h-full w-full">
      <View className="w-full h-full">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} className="flex-row items-center justify-between pr-5 py-4">
          <View className="flex-row items-center gap-2">
            <Image source={require("../../assets/logo-long.png")} style={{ width: 170, height: 40, borderRadius: 8 }} resizeMode="contain" />
          </View>
          <Pressable
            onPress={() => router.push(user ? "/profile" : "/sign-in")}
            className="h-9 w-9 items-center justify-center rounded-[4px] border border-ink/10 bg-paper"
          >
            <UserIcon size={18} color="#16266b" />
          </Pressable>
        </Animated.View>
        <ScrollView
          className="flex-1 bg-sand"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 6, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View entering={FadeInDown.delay(80).duration(420)} className="px-5 pt-6">
            <Text className="font-sans text-sm text-ink-soft/70">
              {user?.email ? `Bonjour, ${user.email.split("@")[0]} 👋` : "Bonjour 👋"}
            </Text>
            <Text className="mt-2 font-display text-4xl leading-[0.95] text-ink">
              Votre place de{"\n"}
              <Text className="text-laterite">taxi-brousse</Text>,{"\n"}en 2 minutes.
            </Text>
            <Text className="mt-3 font-sans text-base text-ink-soft">
              Comparez les départs, choisissez votre siège, payez par Mobile Money.
            </Text>
          </Animated.View>

          {/* Search card */}
          <Animated.View entering={FadeInDown.delay(160).duration(420)} className="px-5 pt-6">
            <Card className="gap-3 p-4">
              <DestinationField
                label="Départ"
                value={origin}
                placeholder="Ville de départ"
                options={allDests}
                onSelect={(v) => { setOrigin(v); setTried(false); }}
                tint="#16266b"
                error={originErr}
              />
              <View className="h-px bg-ink/8" />
              <DestinationField
                label="Arrivée"
                value={dest}
                placeholder="Ville d'arrivée"
                options={allDests}
                onSelect={(v) => { setDest(v); setTried(false); }}
                tint="#f5821f"
                error={destErr}
              />

              <DateField value={date} onChange={setDate} />

              {sameErr ? <Text className="font-sans text-xs text-laterite-deep">{sameErr}</Text> : null}

              <Button size="md" className="mt-1" onPress={goSearch} loading={searching}>
                {!searching && <Search size={18} color="#ffffff" />}
                <Text className="font-sans font-medium text-paper">Rechercher</Text>
              </Button>
            </Card>
          </Animated.View>

          {/* Popular / upcoming */}
          <View className="px-5 pt-9">
            <Text className="mb-3 font-display text-2xl text-ink">Prochains départs</Text>
            {popular.length === 0 ? (
              <Text className="font-sans text-sm text-ink-soft/70">Aucun départ programmé pour le moment.</Text>
            ) : (
              popular.map((r, i) => {
                const booked = r.tickets?.length ?? 0;
                const total = r.seatsTotal;
                const full = booked >= total;
                return (
                  <Animated.View key={r.id} entering={FadeInDown.delay(240 + i * 70).duration(420)}>
                    <Card className="mb-3">
                      {/* Coop + occupancy */}
                      <View className="flex-row items-center gap-3">
                        <CoopLogo url={r.cooperative?.logoUrl} brandColor={r.cooperative?.brandColor} name={r.coopName} size={40} />
                        <View className="flex-1">
                          <Text className="font-sans text-sm font-bold text-laterite" numberOfLines={1}>{r.coopName}</Text>
                          <Text className="font-mono text-[11px] text-ink-soft/60">{fmtDateKey(r.departDate)}</Text>
                        </View>
                        <Badge
                          tone={full ? "danger" : booked / total >= 0.8 ? "warning" : "success"}
                          label={full ? "Complet" : `${booked}/${total} places`}
                        />
                      </View>

                      {/* Route */}
                      <View className="mt-3 flex-row items-center gap-2">
                        <Text className="font-display text-lg text-ink">{r.originName}</Text>
                        <ArrowRight size={15} color="#f5821f" />
                        <Text className="font-display text-lg text-laterite">{r.destName}</Text>
                      </View>

                      {/* Time + price */}
                      <View className="mt-2 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5">
                          <Clock size={14} color="#4a5680" />
                          <Text className="font-mono text-sm text-ink-soft">{fmtTime(r.departureAt)}</Text>
                        </View>
                        <Text className="font-mono text-lg text-ink">{fmtMoney(r.price, r.currency)}</Text>
                      </View>

                      <Button
                        className="mt-3"
                        disabled={full}
                        onPress={() =>
                          router.push({
                            pathname: "/results",
                            params: { origin: r.originName, dest: r.destName, date: r.departDate },
                          })
                        }
                      >
                        <Text className="font-sans font-medium text-paper">Réserver</Text>
                      </Button>
                    </Card>
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
