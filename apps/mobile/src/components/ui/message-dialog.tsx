import { Text, View } from "react-native";
import { Button } from "@/components/ui";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type Notice = { title: string; message: string; onClose?: () => void };

/** Themed in-app replacement for native Alert.alert (single action). */
export function MessageDialog({
  notice,
  onDismiss,
  actionLabel = "OK",
}: {
  notice: Notice | null;
  onDismiss: () => void;
  actionLabel?: string;
}) {
  function close() {
    notice?.onClose?.();
    onDismiss();
  }
  return (
    <Dialog open={!!notice} onOpenChange={(o) => !o && close()}>
      <DialogContent showClose={false} className="gap-3">
        <DialogTitle className="font-display text-xl text-ink">{notice?.title}</DialogTitle>
        <Text className="font-sans text-base text-ink-soft">{notice?.message}</Text>
        <View className="mt-1">
          <Button onPress={close}>
            <Text className="font-sans font-medium text-paper">{actionLabel}</Text>
          </Button>
        </View>
      </DialogContent>
    </Dialog>
  );
}
