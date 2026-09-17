import { useEffect, useRef, useState } from "react";
import { Image, View } from "react-native";
import { cn } from "@/lib/cn";

const LOAD_TIMEOUT_MS = 2500;

/** Cooperative avatar: real logo when available, else the Coopérative Plus mark. */
export function CoopLogo({
  url,
  size = 40,
  className,
}: {
  url?: string | null;
  name?: string;
  size?: number;
  brandColor?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const settledRef = useRef(false);

  // A broken/expired remote logo (e.g. an expired signed URL) doesn't reliably
  // fire onError on iOS — the request can just hang, leaving the tile blank
  // forever. Fall back unconditionally if it hasn't loaded within a timeout,
  // regardless of whether any network callback ever fires.
  useEffect(() => {
    settledRef.current = false;
    setFailed(false);
    if (!url) return;
    const t = setTimeout(() => {
      if (!settledRef.current) {
        settledRef.current = true;
        setFailed(true);
      }
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [url]);

  function markFailed() {
    settledRef.current = true;
    setFailed(true);
  }
  function markLoaded() {
    settledRef.current = true;
  }

  const showImage = !!url && !failed;
  return (
    <View
      className={cn("items-center justify-center overflow-hidden rounded-[4px] ", className)}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          source={{ uri: url! }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onLoad={markLoaded}
          onError={markFailed}
        />
      ) : (
        <Image
          source={require("../../assets/logo-round.png")}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}
