import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useDocument } from "@/providers/DocumentProvider";
import { useStore } from "@/store/useStore";

type StatusIcon = {
  name: SymbolViewProps["name"];
  color: string;
  animated?: boolean;
};

export function StatusText() {
  const theme = useTheme();
  const { connectionStatus, isReady } = useDocument();
  const workflow = useStore((state) => state.workflow);
  const command = useStore((state) => state.transcribedCommand);
  const error = useStore((state) => state.error);
  const setError = useStore((state) => state.setError);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeout = setTimeout(() => setError(null), 4500);
    return () => clearTimeout(timeout);
  }, [error, setError]);

  let message = "Tap the microphone and dictate an edit.";
  let icon: StatusIcon = {
    name: "pencil.and.scribble",
    color: theme.textSecondary,
  };

  if (error) {
    icon = {
      name: "exclamationmark.triangle.fill",
      color: theme.error,
    };
  } else if (connectionStatus === "disconnected") {
    message = isReady
      ? "Offline. Changes will sync when reconnected."
      : "Could not connect to the document server.";
    icon = {
      name: "wifi.slash",
      color: theme.error,
    };
  } else if (!isReady) {
    message = "Connecting to your document...";
    icon = {
      name: "network",
      color: "#8f6b43",
      animated: true,
    };
  } else if (workflow === "recording") {
    message = "Listening... Tap the button again to stop.";
    icon = {
      name: "waveform",
      color: "#9f3535",
      animated: true,
    };
  } else if (workflow === "processing") {
    message = command
      ? `Applying: "${command}"`
      : "Transcribing your instruction...";
    icon = {
      name: "wand.and.stars",
      color: "#8f6b43",
      animated: true,
    };
  } else if (command) {
    message = `Command: "${command}"`;
    icon = {
      name: "checkmark.bubble.fill",
      color: "#2f6b48",
    };
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      style={styles.container}
    >
      <SymbolView
        animationSpec={
          icon.animated
            ? {
                effect: { type: "pulse", wholeSymbol: true },
                repeating: true,
                speed: 1.2,
              }
            : undefined
        }
        name={icon.name}
        size={18}
        tintColor={icon.color}
        type="hierarchical"
        weight="semibold"
      />
      <ThemedText
        style={styles.text}
        themeColor={error ? "error" : "textSecondary"}
      >
        {error ?? message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
});
