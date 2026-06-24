import { useState } from "react";
import { Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Constants from "expo-constants";
import { Armchair, Bell, CreditCard, Globe, Mail, MapPin, Phone, Search, ShieldCheck } from "lucide-react-native";
import { Card } from "@/components/ui";
import { useColors } from "@/lib/colors";
import { sendTestNotification } from "@/lib/notifications";

const VERSION = Constants.expoConfig?.version ?? "1.0.0";

const FEATURES = [
  { Icon: Search, title: "Comparez les départs", body: "Tous les taxis-brousse et coopératives, en un seul endroit." },
  { Icon: Armchair, title: "Choisissez votre siège", body: "Visualisez le véhicule et réservez la place exacte." },
  { Icon: CreditCard, title: "Paiement simple", body: "Mobile Money ou à bord, selon la coopérative." },
  { Icon: ShieldCheck, title: "Billet électronique", body: "QR code sécurisé, présenté au chauffeur." },
];

function ContactRow({ Icon, label, value, onPress }: { Icon: typeof Mail; label: string; value: string; onPress?: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="flex-row items-center gap-3 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-[4px] bg-sand">
        <Icon size={16} color={c.ink} />
      </View>
      <View className="flex-1">
        <Text className="font-mono text-[10px] uppercase tracking-wider text-ink-soft/55">{label}</Text>
        <Text className="font-sans text-sm text-ink">{value}</Text>
      </View>
    </Pressable>
  );
}

export default function About() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [testMsg, setTestMsg] = useState<string | null>(null);

  async function testNotif() {
    const ok = await sendTestNotification();
    setTestMsg(ok ? "Notification programmée — dans 5 secondes ✓" : "Indisponible (nécessite un build, pas Expo Go)");
    setTimeout(() => setTestMsg(null), 4000);
  }

  return (
    <View className="flex-1 bg-sand" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-1 pt-3">
        <Text className="font-display text-3xl text-ink">À propos</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Brand */}
        <Animated.View entering={FadeIn.duration(400)} className="items-center py-4">
          <Image source={require("../../assets/logo-round.png")} style={{ width: 84, height: 84, borderRadius: 8 }} resizeMode="contain" />
          <Text className="mt-3 font-display text-2xl text-ink">
            Cooperative<Text className="text-laterite">+</Text>
          </Text>
          <Text className="mt-1 font-mono text-xs text-ink-soft/60">Version {VERSION}</Text>
          <Text className="mt-3 text-center font-sans text-sm leading-5 text-ink-soft">
            La façon simple et moderne de réserver votre place de taxi-brousse à Madagascar.
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(80).duration(420)} className="mt-2">
          <Card className="gap-1 p-2">
            {FEATURES.map((f, i) => (
              <View key={i} className="flex-row items-start gap-3 p-3">
                <View className="h-10 w-10 items-center justify-center rounded-[4px] bg-laterite/12">
                  <f.Icon size={18} color={c.laterite} />
                </View>
                <View className="flex-1">
                  <Text className="font-sans text-base font-semibold text-ink">{f.title}</Text>
                  <Text className="mt-0.5 font-sans text-sm text-ink-soft">{f.body}</Text>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Contact */}
        <Animated.View entering={FadeInDown.delay(160).duration(420)} className="mt-5">
          <Text className="mb-2 font-display text-lg text-ink">Contact</Text>
          <Card className="px-4 py-1">
            <ContactRow Icon={Globe} label="Site web" value="cooperativeplus.mg" onPress={() => Linking.openURL("https://cooperativeplus.vercel.app").catch(() => {})} />
            <View className="h-px bg-ink/8" />
            <ContactRow Icon={Mail} label="Email" value="tsiresymila@gmail.com" onPress={() => Linking.openURL("mailto:tsiresymila@gmail.com").catch(() => {})} />
            <View className="h-px bg-ink/8" />
            <ContactRow Icon={Phone} label="Téléphone" value="+261 34 20 835 74" onPress={() => Linking.openURL("tel:+261342083574").catch(() => {})} />
            <View className="h-px bg-ink/8" />
            <ContactRow Icon={MapPin} label="Adresse" value="Antananarivo, Madagascar" />
          </Card>
        </Animated.View>

        {/* Notification test */}
        <Animated.View entering={FadeInDown.delay(200).duration(420)} className="mt-5">
          <Pressable
            onPress={testNotif}
            className="flex-row items-center gap-3 rounded-[4px] border border-ink/10 bg-paper px-4 py-3 active:opacity-90"
          >
            <View className="h-9 w-9 items-center justify-center rounded-[4px] bg-laterite/12">
              <Bell size={16} color={c.laterite} />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-sm font-semibold text-ink">Tester la notification</Text>
              <Text className="font-sans text-xs text-ink-soft/60">Rappel de départ dans 5 secondes</Text>
            </View>
          </Pressable>
          {testMsg ? <Text className="mt-2 px-1 font-sans text-xs text-ink-soft">{testMsg}</Text> : null}
        </Animated.View>

        <Text className="mt-6 text-center font-sans text-xs text-ink-soft/50">
          Fait avec ❤️ à Madagascar · © {new Date().getFullYear()} Tsiresy Milà
        </Text>
      </ScrollView>
    </View>
  );
}
