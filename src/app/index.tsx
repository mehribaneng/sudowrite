import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ControlBar } from "@/components/ControlBar";
import { DiffSheet } from "@/components/DiffSheet";
import { Editor } from "@/components/Editor";
import { StatusText } from "@/components/StatusText";
import { ThemedView } from "@/components/ui/themed-view";
import { useStore } from "@/store/useStore";

export default function HomeScreen() {
  const content = useStore((state) => state.content);
  const workflow = useStore((state) => state.workflow);
  const pendingEdit = useStore((state) => state.pendingEdit);
  const transcribedCommand = useStore((state) => state.transcribedCommand);
  const setContent = useStore((state) => state.setContent);
  const applyPendingEdit = useStore((state) => state.applyPendingEdit);
  const rejectPendingEdit = useStore((state) => state.rejectPendingEdit);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          <View style={styles.header}>
            <StatusText />
            <ControlBar />
          </View>

          <Editor
            content={content}
            editable={workflow === "idle" && pendingEdit === null}
            onChangeText={setContent}
          />

          <DiffSheet
            command={transcribedCommand}
            diff={pendingEdit?.diff ?? []}
            visible={pendingEdit !== null}
            onApply={applyPendingEdit}
            onReject={rejectPendingEdit}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    gap: 14,
    paddingTop: 12,
    paddingBottom: 18,
  },
});
