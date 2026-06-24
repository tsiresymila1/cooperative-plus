/** react-native-reusables Dialog (trimmed) built on @rn-primitives/dialog. */
import * as DialogPrimitive from "@rn-primitives/dialog";
import { X } from "lucide-react-native";
import * as React from "react";
import { Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { cn } from "@/lib/cn";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

function DialogContent({
  className,
  portalHost,
  showClose = true,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  portalHost?: string;
  showClose?: boolean;
}) {
  const { onOpenChange } = DialogPrimitive.useRootContext();
  return (
    <DialogPrimitive.Portal hostName={portalHost}>
      <DialogPrimitive.Overlay asChild>
        <Pressable
          onPress={() => onOpenChange(false)}
          className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center bg-ink/40 p-5"
        >
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} className="w-full max-w-[420px]">
            {/* Swallow taps so pressing the card doesn't close the dialog. */}
            <Pressable onPress={() => {}}>
              <DialogPrimitive.Content
                className={cn(
                  "w-full gap-4 rounded-[4px] border border-ink/10 bg-paper p-5",
                  className,
                )}
                {...props}
              >
                {children}
                {showClose && (
                  <DialogPrimitive.Close
                    hitSlop={12}
                    className="absolute right-3 top-3 h-7 w-7 items-center justify-center rounded-[4px] bg-sand active:opacity-80"
                  >
                    <X size={15} color="#16266b" />
                  </DialogPrimitive.Close>
                )}
              </DialogPrimitive.Content>
            </Pressable>
          </Animated.View>
        </Pressable>
      </DialogPrimitive.Overlay>
    </DialogPrimitive.Portal>
  );
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger };
