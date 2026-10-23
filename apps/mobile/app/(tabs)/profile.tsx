import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { LogOut, Ticket as TicketIcon } from "lucide-react-native";
import { Button, Card, Field, Input, Spinner } from "@/components/ui";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, isLoading: authLoading } = useAuth();

  const { data } = db.useQuery(user ? { $users: { $: { where: { id: user.id } } } } : null);
  const profile = data?.$users?.[0];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile?.id]);

  async function save() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await db.transact(
        db.tx.$users[user.id]!.update({
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await db.auth.signOut();
    router.replace("/");
  }

  return (
    <View className="flex-1 bg-sand" style={{ paddingTop: insets.top }}>
      <View className="px-5 py-3">
        <Text className="font-display text-3xl text-ink">Profil</Text>
      </View>

      {authLoading ? (
        <Spinner />
      ) : !user ? (
        <View className="flex-1">
          <EmptyState
            title="Connectez-vous"
            message="Vous n'êtes pas connecté."
            actionLabel="Se connecter"
            onAction={() => router.push("/sign-in")}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(400)}>
            <Card>
              <Text className="font-code text-xs text-ink-soft/70">Connecté en tant que</Text>
              <Text className="mt-1 font-display text-lg text-ink">{user.email}</Text>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(420)} className="mt-5">
            <Text className="mb-2 font-display text-lg text-ink">Informations</Text>
            <Card className="gap-3">
              <Field label="Nom">
                <Input value={name} onChangeText={setName} placeholder="Votre nom" autoCapitalize="words" />
              </Field>
              <View className="h-px bg-ink/8" />
              <Field label="Téléphone">
                <Input value={phone} onChangeText={setPhone} placeholder="034 12 345 67" keyboardType="phone-pad" />
              </Field>
            </Card>
            <Button variant="ink" className="mt-3" onPress={save} loading={saving}>
              <Text className="font-display font-medium text-white uppercase">Enregistrer&nbsp;</Text>
            </Button>
            {saved && <Text className="mt-2 text-center font-body text-sm text-baobab">Enregistré ✓</Text>}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(420)} className="mt-5">
            <Button variant="outline" onPress={() => router.push("/bookings")}>
              <TicketIcon size={18} color="#14314C" />
              <Text className="font-body font-medium text-ink">Mes réservations</Text>
            </Button>
            <Button variant="ghost" className="mt-2" onPress={() => setConfirmOut(true)}>
              <LogOut size={18} color="#c2902f" />
              <Text className="font-body font-medium text-laterite-deep">Se déconnecter</Text>
            </Button>
          </Animated.View>
        </ScrollView>
      )}

      <Dialog open={confirmOut} onOpenChange={setConfirmOut}>
        <DialogContent showClose={false} className="gap-3">
          <DialogTitle className="font-display text-xl text-ink">Se déconnecter ?</DialogTitle>
          <Text className="font-body text-base text-ink-soft">
            Vous devrez vous reconnecter pour accéder à vos réservations.
          </Text>
          <View className="mt-1 flex-row gap-2">
            <Button variant="outline" className="flex-1" onPress={() => setConfirmOut(false)}>
              <Text className="font-body font-medium text-ink">Annuler</Text>
            </Button>
            <Button variant="ink" className="flex-1" onPress={() => { setConfirmOut(false); signOut(); }}>
              <LogOut size={18} color="#ffffff" />
              <Text className="font-body font-medium text-paper">Déconnexion</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
}
