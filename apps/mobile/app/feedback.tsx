import { useEffect, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { CheckCircle2, ChevronLeft, ImagePlus, X } from "lucide-react-native";
import { productFeedbackSchema } from "@cp/validation";
import { Button, Card, Field, Input } from "@/components/ui";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { submitMobileProductFeedback, type MobileFeedbackImage } from "@/lib/feedback";
import { useColors } from "@/lib/colors";
import { cn } from "@/lib/cn";

const CATEGORIES = [
  ["suggestion", "Suggestion"],
  ["bug", "Problème"],
  ["difficulty", "Difficulté"],
  ["other", "Autre"],
] as const;

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const { data } = db.useQuery(user ? { $users: { $: { where: { id: user.id } } } } : null);
  const profile = data?.$users?.[0];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number][0]>("suggestion");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<MobileFeedbackImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (user?.email) setEmail(user.email);
  }, [profile?.name, user?.email]);

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setImage(result.assets[0]);
  }

  async function submit() {
    const parsed = productFeedbackSchema.safeParse({ source: "mobile", category, name, email, message });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Vérifiez les informations.");
    setBusy(true);
    setError("");
    try {
      await submitMobileProductFeedback({ ...parsed.data, source: "mobile" }, image);
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’envoi a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-sand" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View className="flex-row items-center gap-3 border-b border-ink/8 bg-paper px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <Pressable onPress={() => router.back()} className="size-9 items-center justify-center rounded-lg border border-ink/10"><ChevronLeft size={20} color={colors.ink} /></Pressable>
        <Text className="font-display text-2xl text-ink">Donner un feedback</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        {sent ? (
          <Card className="items-center p-7">
            <CheckCircle2 size={48} color="#62b22e" />
            <Text className="mt-4 text-center font-display text-2xl text-ink">Merci pour votre retour</Text>
            <Text className="mt-2 text-center font-body text-sm text-ink-soft">Votre message a bien été transmis à notre équipe.</Text>
            <Button variant="outline" className="mt-6 w-full" onPress={() => router.back()}>Fermer</Button>
          </Card>
        ) : (
          <Card className="gap-5 p-5">
            <Field label="Nom"><Input value={name} onChangeText={setName} autoCapitalize="words" /></Field>
            <View className="h-px bg-ink/8" />
            <Field label="Email"><Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></Field>
            <View className="h-px bg-ink/8" />
            <Field label="Type de retour">
              <View className="flex-row flex-wrap gap-2 pt-1">
                {CATEGORIES.map(([value, label]) => <Pressable key={value} onPress={() => setCategory(value)} className={cn("rounded-full border px-3 py-2", category === value ? "border-laterite bg-laterite/15" : "border-ink/10")}><Text className="font-body text-sm text-ink">{label}</Text></Pressable>)}
              </View>
            </Field>
            <View className="h-px bg-ink/8" />
            <Field label="Message"><Input value={message} onChangeText={setMessage} multiline textAlignVertical="top" className="min-h-32 pt-2" placeholder="Décrivez votre expérience…" maxLength={4000} /></Field>
            <View className="h-px bg-ink/8" />
            <Field label="Capture d’écran (facultatif)">
              {image ? <View className="mt-2 overflow-hidden rounded-lg border border-ink/10"><Image source={{ uri: image.uri }} className="h-40 w-full" resizeMode="cover" /><Pressable onPress={() => setImage(null)} className="absolute right-2 top-2 size-9 items-center justify-center rounded-full bg-strong"><X size={18} color="#fff" /></Pressable></View> : <Pressable onPress={chooseImage} className="mt-2 min-h-20 items-center justify-center rounded-lg border border-dashed border-ink/15"><ImagePlus size={22} color={colors.inkSoft} /><Text className="mt-1 font-body text-sm text-ink-soft">Choisir une image</Text></Pressable>}
            </Field>
            {error ? <Text className="rounded-lg bg-red-500/10 p-3 font-body text-sm text-red-600">{error}</Text> : null}
            <Button variant="ink" loading={busy} onPress={submit}><Text className="font-display font-medium uppercase text-white">Envoyer</Text></Button>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
