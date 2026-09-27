import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "react-native-nitro-google-signin";
import { ArrowRight, ChevronLeft, Mail, ShieldCheck } from "lucide-react-native";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useColors } from "@/lib/colors";
import { db } from "@/lib/db";

const googleClientName = process.env.EXPO_PUBLIC_INSTANT_GOOGLE_CLIENT_NAME;
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

if (googleWebClientId) {
  GoogleOneTapSignIn.configure({ webClientId: googleWebClientId });
}

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const codeRef = useRef<TextInput>(null);

  // Keep the provider choices visible on first render. The code input can
  // safely receive focus once the user has explicitly chosen email login.
  useEffect(() => {
    if (step !== "code") return;
    const t = setTimeout(() => codeRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [step]);

  async function sendCode() {
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) {
      setErr("Adresse email invalide");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await db.auth.sendMagicCode({ email: e });
      setEmail(e);
      setStep("code");
    } catch {
      setErr("Échec de l'envoi du code. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(value?: string) {
    const c = (value ?? code).trim();
    if (c.length < 6) {
      setErr("Code à 6 chiffres requis");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await db.auth.signInWithMagicCode({ email, code: c });
      router.back();
    } catch {
      setErr("Code incorrect ou expiré.");
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    if (!googleClientName || !googleWebClientId) {
      setErr("La connexion Google n’est pas encore configurée.");
      return;
    }

    setGoogleBusy(true);
    setErr(null);
    try {
      await GoogleOneTapSignIn.checkPlayServices();
      const result = await GoogleOneTapSignIn.presentExplicitSignIn();

      if (isCancelledResponse(result)) return;
      if (!isSuccessResponse(result) || !result.data.idToken) {
        throw new Error("Jeton Google manquant");
      }

      await db.auth.signInWithIdToken({
        idToken: result.data.idToken,
        clientName: googleClientName,
      });
      router.back();
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.DEVELOPER_ERROR) {
        setErr("Configuration Google Android invalide (package, client ID ou SHA-1).");
      } else if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErr("Google Play Services est indisponible sur cet appareil.");
      } else {
        setErr("Échec de la connexion avec Google. Réessayez.");
      }
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-sand"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center gap-3 px-5 py-3">
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-[4px] border border-ink/10 bg-paper">
          <ChevronLeft size={20} color={c.ink} />
        </Pressable>
        <Text className="font-display text-lg text-ink">Connexion</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom + 24, 40),
        }}
      >
        {/* Brand mark */}
        <Animated.View entering={FadeIn.duration(400)} className="mb-8 items-center">
          {step === "email" ? (
            <Image source={require("../assets/ic_launcher.png")} style={{ width: 64, height: 64, borderRadius: 32 }} className="rounded-full" resizeMode="contain" />
          ) : (
            <View className="h-16 w-16 items-center justify-center rounded-[4px] bg-navy">
              <ShieldCheck size={28} color="#D9A441" />
            </View>
          )}
          <Text className="mt-4 font-display text-3xl text-ink">
            {step === "email" ? "Connexion" : "Vérification"}
          </Text>
          <Text className="mt-1 text-center font-body text-sm text-ink-soft">
            {step === "email"
              ? "Entrez votre email — un code à 6 chiffres vous sera envoyé."
              : `Code envoyé à ${email}`}
          </Text>
        </Animated.View>

        {step === "email" ? (
          <Animated.View entering={FadeInDown.delay(80).duration(420)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continuer avec Google"
              disabled={busy || googleBusy}
              onPress={signInWithGoogle}
              className={cn(
                "h-14 flex-row items-center justify-center gap-3 rounded-[4px] border border-ink/10 bg-paper px-4",
                (googleBusy || busy) && "opacity-60",
              )}
            >
              {googleBusy ? (
                <ActivityIndicator color={c.ink} />
              ) : (
                <Image
                  accessibilityIgnoresInvertColors
                  resizeMode="contain"
                  source={require("../assets/google-g-logo.png")}
                  style={{ width: 24, height: 24 }}
                />
              )}
              <Text className="font-body text-base font-medium text-ink">
                {googleBusy ? "Connexion…" : "Continuer avec Google"}
              </Text>
            </Pressable>

            <View className="my-2 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-ink/10" />
              <Text className="font-code text-xs uppercase text-ink-soft/60">ou</Text>
              <View className="h-px flex-1 bg-ink/10" />
            </View>

            <View className="h-14 flex-row items-center gap-2 rounded-[4px] border border-ink/10 bg-paper px-4">
              <Mail size={18} color={c.inkSoft} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.mg"
                placeholderTextColor={c.inkSoft + "88"}
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={sendCode}
                style={{ paddingVertical: 0 }}
                className="flex-1 font-body text-base text-ink"
              />
            </View>

            {err && <Text className="mt-2 px-1 font-body text-sm text-laterite-deep">{err}</Text>}

            <Button size="md" className="mt-4" onPress={sendCode} loading={busy}>
              <Text className="font-display font-medium text-paper uppercase">Envoyer le code</Text>
              {!busy && <ArrowRight size={18} color="#ffffff" />}
            </Button>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(80).duration(420)}>
            {/* OTP cells over a hidden input */}
            <Pressable
              onPress={() => {
                // Android: after the soft keyboard is dismissed (back button/swipe),
                // RN can still think this input is focused and skip re-raising the
                // keyboard on a plain .focus() call — force a blur first.
                codeRef.current?.blur();
                requestAnimationFrame(() => codeRef.current?.focus());
              }}
            >
              <View className="flex-row justify-center gap-2">
                {Array.from({ length: 6 }, (_, i) => {
                  const char = code[i] ?? "";
                  const active = i === code.length;
                  return (
                    <View
                      key={i}
                      className={cn(
                        "h-14 w-12 items-center justify-center rounded-[4px] border bg-paper",
                        char ? "border-navy" : active ? "border-laterite" : "border-ink/12",
                      )}
                    >
                      <Text className="font-code text-2xl text-ink">{char}</Text>
                    </View>
                  );
                })}
              </View>
              <TextInput
                ref={codeRef}
                value={code}
                onChangeText={(t) => {
                  const digits = t.replace(/\D/g, "").slice(0, 6);
                  setCode(digits);
                  if (digits.length === 6) verify(digits);
                }}
                keyboardType="number-pad"
                maxLength={6}
                className="absolute h-px w-px opacity-0"
              />
            </Pressable>

            {err && <Text className="mt-3 px-1 text-center font-body text-sm text-laterite-deep">{err}</Text>}

            <Button size="md" className="mt-5" onPress={() => verify()} loading={busy}>
              <Text className="font-display font-medium text-paper uppercase">Se connecter</Text>
            </Button>

            <Pressable onPress={() => { setStep("email"); setCode(""); setErr(null); }} className="mt-4">
              <Text className="text-center font-body text-sm text-ink-soft/70">Changer d'email</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
