import { useEffect } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ControlBar } from "@/components/ControlBar";
import { DiffSheet } from "@/components/DiffSheet";
import { Editor } from "@/components/Editor";
import { StatusText } from "@/components/StatusText";
import { ThemedView } from "@/components/ui/themed-view";
import { DocumentProvider, useDocument } from "@/providers/DocumentProvider";
import { useStore } from "@/store/useStore";

function ScribeScreen() {
  const { content, isReady, updateText, applyEditIfCurrent } = useDocument();
  const workflow = useStore((state) => state.workflow);
  const pendingEdit = useStore((state) => state.pendingEdit);
  const transcribedCommand = useStore((state) => state.transcribedCommand);
  const clearPendingEdit = useStore((state) => state.clearPendingEdit);
  const setError = useStore((state) => state.setError);

  useEffect(() => {
    if (pendingEdit && content !== pendingEdit.original) {
      clearPendingEdit();
      setError("The document changed. Run the AI edit again.");
    }
  }, [clearPendingEdit, content, pendingEdit, setError]);

  const applyPendingEdit = () => {
    if (!pendingEdit) {
      return;
    }

    const applied = applyEditIfCurrent(
      pendingEdit.original,
      pendingEdit.edited,
    );
    clearPendingEdit();

    if (!applied) {
      setError("The document changed. Run the AI edit again.");
    }
  };

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
            editable={
              isReady && workflow === "idle" && pendingEdit === null
            }
            onChangeText={updateText}
          />

          <DiffSheet
            command={transcribedCommand}
            diff={pendingEdit?.diff ?? []}
            visible={pendingEdit !== null}
            onApply={applyPendingEdit}
            onReject={clearPendingEdit}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

export default function HomeScreen() {
  return (
    <DocumentProvider>
      <ScribeScreen />
    </DocumentProvider>
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
