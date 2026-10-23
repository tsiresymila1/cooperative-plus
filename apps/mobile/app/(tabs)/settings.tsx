import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, type Href } from "expo-router";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronRight, Info, Languages, MessageSquareText, Moon, ShieldCheck } from "lucide-react-native";
import { Card } from "@/components/ui";
import { useColors } from "@/lib/colors";

function SettingRow({ icon, title, description, onPress, disabled, trailing }: {
  icon: ReactNode;
  title: string;
  description?: string;
  onPress?: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={disabled}
      onPress={onPress}
      className="min-h-16 flex-row items-center gap-3 px-4 py-3 active:bg-ink/5"
    >
      <View className="h-10 w-10 items-center justify-center rounded-[4px] bg-laterite/12">{icon}</View>
      <View className="flex-1">
        <Text className="font-body text-base font-semibold text-ink">{title}</Text>
        {description ? <Text className="mt-0.5 font-body text-xs text-ink-soft">{description}</Text> : null}
      </View>
      {trailing ?? (onPress ? <ChevronRight size={18} color={colors.inkSoft} /> : null)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  const [savingTheme, setSavingTheme] = useState(false);

  async function toggleTheme(enabled: boolean) {
    const next = enabled ? "dark" : "light";
    setSavingTheme(true);
    setColorScheme(next);
    try {
      await AsyncStorage.setItem("cp-theme", next);
    } finally {
      setSavingTheme(false);
    }
  }

  return (
    <View className="flex-1 bg-sand" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-2 pt-3">
        <Text className="font-display text-3xl text-ink">Réglages</Text>
        <Text className="mt-1 font-body text-sm text-ink-soft">Personnalisez votre expérience Coop Plus.</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(380)}>
          <Text className="mb-2 font-display text-lg text-ink">Préférences</Text>
          <Card className="overflow-hidden p-0">
            <SettingRow
              icon={<Moon size={19} color={dark ? colors.laterite : colors.inkSoft} />}
              title="Thème sombre"
              description={dark ? "Activé" : "Désactivé"}
              trailing={
                <Switch
                  accessibilityLabel="Activer le thème sombre"
                  disabled={savingTheme}
                  value={dark}
                  onValueChange={toggleTheme}
                  thumbColor="#ffffff"
                  trackColor={{ false: colors.border, true: colors.laterite }}
                />
              }
            />
            <View className="ml-[68px] h-px bg-ink/8" />
            <SettingRow
              disabled
              icon={<Languages size={19} color={colors.inkSoft} />}
              title="Langue"
              description="D’autres langues seront bientôt disponibles"
              trailing={<Text className="font-body text-sm text-ink-soft">Français</Text>}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(380)} className="mt-6">
          <Text className="mb-2 font-display text-lg text-ink">Aide et informations</Text>
          <Card className="overflow-hidden p-0">
            <SettingRow
              icon={<MessageSquareText size={19} color={colors.laterite} />}
              title="Donner un feedback"
              description="Signalez un problème ou partagez une suggestion"
              onPress={() => router.push("/feedback" as Href)}
            />
            <View className="ml-[68px] h-px bg-ink/8" />
            <SettingRow
              icon={<Info size={19} color={colors.inkSoft} />}
              title="À propos de Coop Plus"
              onPress={() => router.push("/about" as Href)}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(380)} className="mt-6">
          <Card className="flex-row items-center gap-3 bg-navy p-4">
            <ShieldCheck size={22} color="#D9A441" />
            <View className="flex-1">
              <Text className="font-body text-sm font-semibold text-white">Vos données restent protégées</Text>
              <Text className="mt-0.5 font-body text-xs text-white/65">Les réglages sont enregistrés uniquement sur cet appareil.</Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
