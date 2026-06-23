/** Cooperative Plus brand primitives: cva + cn + NativeWind className. */
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type ViewProps,
} from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const button = cva("flex-row items-center justify-center gap-2 rounded-[4px] active:opacity-90", {
  variants: {
    variant: {
      primary: "bg-laterite",
      ink: "bg-ink",
      outline: "border border-ink/15 bg-paper",
      ghost: "bg-transparent",
    },
    size: { sm: "h-10 px-4", md: "h-12 px-5", lg: "h-[54px] px-6" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});
const buttonText = cva("font-sans font-medium", {
  variants: {
    variant: { primary: "text-paper", ink: "text-sand", outline: "text-ink", ghost: "text-ink" },
    size: { sm: "text-sm", md: "text-base", lg: "text-base" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

export function Button({
  className,
  variant,
  size,
  children,
  loading,
  disabled,
  ...p
}: PressableProps & VariantProps<typeof button> & { children: React.ReactNode; loading?: boolean }) {
  const spinnerColor = variant === "outline" || variant === "ghost" ? "#0f2d5c" : "#ffffff";
  return (
    <Pressable
      className={cn(button({ variant, size }), (loading || disabled) && "opacity-60", className)}
      disabled={loading || disabled}
      {...p}
    >
      {loading && <ActivityIndicator size="small" color={spinnerColor} />}
      {typeof children === "string"
        ? <Text className={buttonText({ variant, size })}>{children}</Text>
        : children}
    </Pressable>
  );
}

export function Card({ className, style, ...p }: ViewProps) {
  // Flat: hairline border instead of a shadow — avoids the heavy elevation box
  // that flashed during entrance animations (esp. Android elevation).
  return (
    <View
      className={cn("rounded-[4px] border border-ink/8 bg-paper p-4", className)}
      style={style}
      {...p}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <View className={cn("items-center justify-center py-8", className)}>
      <ActivityIndicator color="#f5821f" />
    </View>
  );
}

export function Field({
  label,
  className,
  icon,
  children,
}: {
  label: string;
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className={className}>
      <Text className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/60">{label}</Text>
      <View className="mt-1 flex-row items-center gap-2">
        {icon}
        <View className="flex-1">{children}</View>
      </View>
    </View>
  );
}

export function Input({ className, ...p }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#4a568066"
      className={cn("font-sans text-base text-ink", className)}
      {...p}
    />
  );
}

export function Badge({ tone = "neutral", label }: { tone?: "neutral" | "success" | "warning" | "danger"; label: string }) {
  const tones = {
    neutral: "bg-ink/10", success: "bg-baobab/15", warning: "bg-clay/20", danger: "bg-laterite/15",
  };
  const text = { neutral: "text-ink-soft", success: "text-baobab", warning: "text-clay", danger: "text-laterite-deep" };
  return (
    <View className={cn("self-start rounded-[4px] px-2.5 py-1", tones[tone])}>
      <Text className={cn("text-xs font-medium", text[tone])}>{label}</Text>
    </View>
  );
}
