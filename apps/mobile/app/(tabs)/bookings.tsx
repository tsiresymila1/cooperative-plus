import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { ArrowRight, Bus, Frown, QrCode } from "lucide-react-native";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { CoopLogo } from "@/components/coop-logo";
import { cn, fmtMoney } from "@/lib/cn";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { bookingStatusFr, fmtDateKey, fmtTime, toDateKey } from "@/lib/domain";
import { TagBadge } from "@/components/tag-badge";

type Tab = "active" | "expired";

export default function Bookings() {
  const insets = useSafeAreaInsets();
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("active");

  const { isLoading, data } = db.useQuery(
    user
      ? {
          bookings: {
            $: {
              where: { "customer.id": user.id },
              order: { createdAt: "desc" },
            },
            tickets: {},
            tripInstance: { cooperative: {}, tag: {} },
          },
        }
      : null,
  );

  const today = toDateKey(new Date());
  const all = data?.bookings ?? [];
  const isExpired = (b: (typeof all)[number]) =>
    b.status === "cancelled" ||
    (b.tripInstance ? b.tripInstance.departDate < today : false);
  const bookings = all.filter((b) =>
    tab === "expired" ? isExpired(b) : !isExpired(b),
  );

  return (
    <View className="flex-1 bg-sand" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-1 pt-3">
        <Text className="font-display text-3xl text-ink">Mes réservations</Text>
      </View>

      {user && (
        <View className="mx-5 mb-3 mt-2 flex-row rounded-[4px] bg-sand-deep/70 p-1">
          {(["active", "expired"] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              style={
                tab === k
                  ? {
                      shadowColor: "#16266b",
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 2,
                    }
                  : undefined
              }
              className={cn(
                "flex-1 items-center rounded-[4px] py-2.5",
                tab === k && "bg-paper",
              )}
            >
              <Text
                className={cn(
                  "font-sans text-sm font-medium",
                  tab === k ? "text-ink" : "text-ink-soft/60",
                )}
              >
                {k === "active" ? "Actifs" : "Expirés"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {authLoading ? (
        <Spinner />
      ) : !user ? (
        <EmptyState
          title="Connectez-vous"
          message="Connectez-vous pour retrouver vos billets."
          actionLabel="Se connecter"
          onAction={() => router.push("/sign-in")}
        />
      ) : isLoading ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={
            tab === "active" ? "Aucun billet actif" : "Aucun billet expiré"
          }
          message={
            tab === "active"
              ? "Vos prochains voyages apparaîtront ici."
              : "Vos voyages passés apparaîtront ici."
          }
          actionLabel="Chercher un trajet"
          onAction={() => router.replace("/")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {bookings.map((b, i) => (
            <Animated.View
              key={b.id}
              entering={FadeInDown.delay(i * 70).duration(420)}
            >
              <TicketCard booking={b} expired={tab === "expired"} />
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function TicketCard({
  booking: b,
  expired,
}: {
  booking: any;
  expired: boolean;
}) {
  const trip = b.tripInstance;

  return (
    <Card className={cn("mb-4 p-0 relative", expired && "opacity-70")}>
      {(trip as any)?.tag && (
        <View className="absolute right-3 z-20" style={{ top: -8 }}>
          <TagBadge
            name={(trip as any).tag.name}
            color={(trip as any).tag.color}
          />
        </View>
      )}
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4">
        <View className="flex-1 flex-row items-center gap-2">
          <CoopLogo
            url={trip?.cooperative?.logoUrl}
            brandColor={trip?.cooperative?.brandColor}
            name={trip?.coopName ?? ""}
            size={30}
          />
          <View className="flex-1">
            <Text
              className="font-sans text-xs font-bold text-laterite"
              numberOfLines={1}
            >
              {trip?.coopName ?? "—"}
            </Text>
            <Text className="font-mono text-[10px] text-ink-soft/90 font-bold">
              {b.reference}
            </Text>
          </View>
        </View>
        <Badge {...bookingStatusFr(b.status)} />
      </View>

      {/* Route timeline */}
      <View className="flex-row items-center px-5 pb-4 pt-3">
        <View className="flex-1">
          <Text className="font-mono text-2xl text-ink">
            {trip ? fmtTime(trip.departureAt) : "--:--"}
          </Text>
          <Text
            className="mt-0.5 font-display text-base text-ink"
            numberOfLines={1}
          >
            {trip?.originName ?? "—"}
          </Text>
        </View>
        <View className="flex-[1.2] items-center px-1">
          <View className="w-full flex-row items-center">
            <View className="h-2 w-2 rounded-full border-2 border-ink/30" />
            <View className="h-px flex-1 bg-ink/15" />
            <Bus size={15} color="#f5821f" />
            <View className="h-px flex-1 bg-ink/15" />
            <View className="h-2 w-2 rounded-full bg-laterite" />
          </View>
          <Text className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-soft/55">
            {trip ? fmtDateKey(trip.departDate) : ""}
          </Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="font-mono text-2xl text-ink-soft">
            {trip?.arrivalEstimateAt ? fmtTime(trip.arrivalEstimateAt) : "—"}
          </Text>
          <Text
            className="mt-0.5 font-display text-base text-laterite"
            numberOfLines={1}
          >
            {trip?.destName ?? "—"}
          </Text>
        </View>
      </View>

      {/* Perforated divider with tear notches */}
      <View className="flex-row items-center">
        <View className="-ml-2.5 h-5 w-5 rounded-full bg-sand" />
        <View className="flex-1 border-t border-dashed border-ink" />
        <View className="-mr-2.5 h-5 w-5 rounded-full bg-sand" />
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <View>
          <Text className="font-mono text-[10px] uppercase tracking-wider text-ink-soft/50">
            {b.seatCount} {b.seatCount > 1 ? "places" : "place"}
          </Text>
          <Text className="mt-0.5 font-mono text-lg text-ink">
            {fmtMoney(b.totalAmount, b.currency)}
          </Text>
        </View>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/confirmation/[id]",
              params: { id: b.id },
            })
          }
          className="flex-row items-center gap-2 rounded-[4px] bg-navy dark:bg-[#003366] px-4 py-2.5 active:opacity-90"
        >
          <QrCode size={16} color="#ffffff" />
          <Text className="font-sans text-sm font-medium text-white">
            Voir le billet
          </Text>
          <ArrowRight size={15} color="#f5821f" />
        </Pressable>
      </View>
    </Card>
  );
}

function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-10 pb-24">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-laterite/10">
        <Frown size={44} color="#f5821f" />
      </View>
      <Text className="mt-5 font-display text-xl text-ink">{title}</Text>
      <Text className="mt-1.5 text-center font-sans text-sm text-ink-soft/70">
        {message}
      </Text>
      <Button size="md" className="mt-6 w-full" onPress={onAction}>
        <Text className="font-sans font-medium text-paper">{actionLabel}</Text>
      </Button>
    </View>
  );
}
