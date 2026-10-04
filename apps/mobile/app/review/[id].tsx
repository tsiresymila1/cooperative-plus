import { useEffect, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { CheckCircle2, ChevronLeft, ImagePlus, Star, X } from "lucide-react-native";
import { tripReviewSchema } from "@cp/validation";
import { Button, Card, Field, Input, Spinner } from "@/components/ui";
import { db } from "@/lib/db";
import { submitMobileTripReview, type MobileFeedbackImage } from "@/lib/feedback";
import { useColors } from "@/lib/colors";

export default function TripReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { data, isLoading } = db.useQuery({
    bookings: { $: { where: { id } }, tripInstance: {}, review: {} },
  });
  const booking = data?.bookings?.[0];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState<MobileFeedbackImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (booking?.contactName) setName(booking.contactName);
    if (booking?.contactEmail) setEmail(booking.contactEmail);
  }, [booking?.contactName, booking?.contactEmail]);

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setImage(result.assets[0]);
  }

  async function submit() {
    if (!booking) return;
    const parsed = tripReviewSchema.safeParse({ bookingReference: booking.reference, name, email, rating, comment });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Vérifiez les informations.");
    setBusy(true);
    setError("");
    try {
      await submitMobileTripReview(parsed.data, image);
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
        <Text className="font-display text-2xl text-ink">Évaluer le trajet</Text>
      </View>
      {isLoading ? <Spinner className="flex-1" /> : !booking ? (
        <View className="flex-1 items-center justify-center px-8"><Text className="font-display text-xl text-ink">Réservation introuvable</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          {sent ? (
            <Card className="items-center p-7"><CheckCircle2 size={48} color="#62b22e" /><Text className="mt-4 text-center font-display text-2xl text-ink">Merci pour votre avis</Text><Text className="mt-2 text-center font-body text-sm text-ink-soft">Votre retour a été transmis à la coopérative.</Text><Button variant="outline" className="mt-6 w-full" onPress={() => router.replace("/bookings")}>Mes réservations</Button></Card>
          ) : booking.review ? (
            <Card className="items-center p-7"><CheckCircle2 size={44} color="#62b22e" /><Text className="mt-4 text-center font-display text-xl text-ink">Trajet déjà évalué</Text></Card>
          ) : (
            <Card className="gap-5 p-5">
              <View><Text className="font-code text-xs font-bold text-laterite">{booking.reference}</Text><Text className="mt-1 font-display text-xl text-ink">{booking.tripInstance?.originName} → {booking.tripInstance?.destName}</Text></View>
              <View className="h-px bg-ink/8" />
              <Field label="Votre note"><View className="mt-2 flex-row gap-2">{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setRating(value)} accessibilityRole="radio" accessibilityState={{ checked: rating === value }}><Star size={32} color={value <= rating ? "#D9A441" : "#CBD5E1"} fill={value <= rating ? "#D9A441" : "transparent"} /></Pressable>)}</View></Field>
              <View className="h-px bg-ink/8" />
              <Field label="Nom"><Input value={name} onChangeText={setName} autoCapitalize="words" /></Field>
              <View className="h-px bg-ink/8" />
              <Field label="Email associé à la réservation"><Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></Field>
              <View className="h-px bg-ink/8" />
              <Field label="Commentaire"><Input value={comment} onChangeText={setComment} multiline textAlignVertical="top" className="min-h-32 pt-2" placeholder="Ponctualité, accueil, confort…" maxLength={4000} /></Field>
              <View className="h-px bg-ink/8" />
              <Field label="Photo (facultatif)">{image ? <View className="mt-2 overflow-hidden rounded-lg border border-ink/10"><Image source={{ uri: image.uri }} className="h-40 w-full" resizeMode="cover" /><Pressable onPress={() => setImage(null)} className="absolute right-2 top-2 size-9 items-center justify-center rounded-full bg-strong"><X size={18} color="#fff" /></Pressable></View> : <Pressable onPress={chooseImage} className="mt-2 min-h-20 items-center justify-center rounded-lg border border-dashed border-ink/15"><ImagePlus size={22} color={colors.inkSoft} /><Text className="mt-1 font-body text-sm text-ink-soft">Choisir une image</Text></Pressable>}</Field>
              {error ? <Text className="rounded-lg bg-red-500/10 p-3 font-body text-sm text-red-600">{error}</Text> : null}
              <Button variant="ink" loading={busy} onPress={submit}><Text className="font-display font-medium uppercase text-white">Envoyer mon avis</Text></Button>
            </Card>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
