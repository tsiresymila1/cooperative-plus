import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { ArrowRight, ChevronLeft, Mail, ShieldCheck } from "lucide-react-native";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const codeRef = useRef<TextInput>(null);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-sand"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center gap-3 px-5 py-3">
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-[4px] border border-ink/10 bg-paper">
          <ChevronLeft size={20} color="#16266b" />
        </Pressable>
        <Text className="font-display text-lg text-ink">Connexion</Text>
      </View>

      <View className="flex-1 justify-center px-5 pb-16">
        {/* Brand mark */}
        <Animated.View entering={FadeIn.duration(400)} className="mb-8 items-center">
          <View className="h-16 w-16 items-center justify-center rounded-[4px] bg-navy">
            {step === "email"
              ? <Mail size={28} color="#f5821f" />
              : <ShieldCheck size={28} color="#f5821f" />}
          </View>
          <Text className="mt-4 font-display text-3xl text-ink">
            {step === "email" ? "Connexion" : "Vérification"}
          </Text>
          <Text className="mt-1 text-center font-sans text-sm text-ink-soft">
            {step === "email"
              ? "Entrez votre email — un code à 6 chiffres vous sera envoyé."
              : `Code envoyé à ${email}`}
          </Text>
        </Animated.View>

        {step === "email" ? (
          <Animated.View entering={FadeInDown.delay(80).duration(420)}>
            <View className="rounded-[4px] border border-ink/10 bg-paper p-1.5">
              <View className="flex-row items-center gap-2 px-3">
                <Mail size={18} color="#4a5680" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="vous@exemple.mg"
                  placeholderTextColor="#4a568066"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  onSubmitEditing={sendCode}
                  className="flex-1 py-3.5 font-sans text-base text-ink"
                />
              </View>
            </View>

            {err && <Text className="mt-2 px-1 font-sans text-sm text-laterite-deep">{err}</Text>}

            <Button size="md" className="mt-4" onPress={sendCode} loading={busy}>
              <Text className="font-sans font-medium text-paper">Envoyer le code</Text>
              {!busy && <ArrowRight size={18} color="#ffffff" />}
            </Button>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(80).duration(420)}>
            {/* OTP cells over a hidden input */}
            <Pressable onPress={() => codeRef.current?.focus()}>
              <View className="flex-row justify-between">
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
                      <Text className="font-mono text-2xl text-ink">{char}</Text>
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
                autoFocus
                className="absolute h-px w-px opacity-0"
              />
            </Pressable>

            {err && <Text className="mt-3 px-1 text-center font-sans text-sm text-laterite-deep">{err}</Text>}

            <Button size="md" className="mt-5" onPress={() => verify()} loading={busy}>
              <Text className="font-sans font-medium text-paper">Se connecter</Text>
            </Button>

            <Pressable onPress={() => { setStep("email"); setCode(""); setErr(null); }} className="mt-4">
              <Text className="text-center font-sans text-sm text-ink-soft/70">Changer d'email</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
