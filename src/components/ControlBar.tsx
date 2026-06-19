import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { useDocument } from "@/providers/DocumentProvider";
import { computeDiff } from "@/lib/diff";
import { useStore } from "@/store/useStore";
import {
  applyEditInstruction,
  getErrorMessage,
  transcribeAudio,
} from "../lib/api";

export function ControlBar() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const { connectionStatus, documentId, getCurrentText, isReady } =
    useDocument();

  const workflow = useStore((state) => state.workflow);
  const pendingEdit = useStore((state) => state.pendingEdit);
  const setWorkflow = useStore((state) => state.setWorkflow);
  const setTranscribedCommand = useStore(
    (state) => state.setTranscribedCommand,
  );
  const setPendingEdit = useStore((state) => state.setPendingEdit);
  const setError = useStore((state) => state.setError);
  const isRecording = workflow === "recording";
  const isProcessing = workflow === "processing";
  const canStartRecording = isReady && connectionStatus === "connected";

  if (pendingEdit !== null) {
    return null;
  }

  const startRecording = async () => {
    try {
      if (!canStartRecording) {
        throw new Error("Wait for the document to connect before dictating.");
      }

      setError(null);
      setTranscribedCommand("");

      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error(
          "Microphone permission is required to dictate an edit.",
        );
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setWorkflow("recording");
    } catch (error) {
      setWorkflow("idle");
      setError(getErrorMessage(error));
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const audioUri = recorder.uri;
      if (!audioUri) {
        throw new Error("The recording could not be saved.");
      }

      setWorkflow("processing");
      const command = await transcribeAudio(audioUri);
      setTranscribedCommand(command);

      if (connectionStatus !== "connected") {
        throw new Error("Reconnect to the document and try the AI edit again.");
      }

      const originalContent = getCurrentText();
      if (!documentId) {
        throw new Error("The document is not ready.");
      }

      const edited = await applyEditInstruction(
        documentId,
        originalContent,
        command,
      );

      if (getCurrentText() !== originalContent) {
        throw new Error("The document changed. Run the AI edit again.");
      }

      setPendingEdit({
        original: originalContent,
        edited,
        diff: computeDiff(originalContent, edited),
      });
      setWorkflow("idle");
    } catch (error) {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => undefined);
      setWorkflow("idle");
      setTranscribedCommand("");
      setError(getErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
        accessibilityRole="button"
        disabled={isProcessing || (!isRecording && !canStartRecording)}
        onPress={isRecording ? stopRecording : startRecording}
        style={({ pressed }) => [
          styles.micButton,
          isRecording && styles.stopButton,
          (isProcessing || (!isRecording && !canStartRecording)) &&
            styles.disabled,
          pressed && !isProcessing && styles.pressed,
        ]}
      >
        {isProcessing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <View style={[styles.dot, isRecording && styles.stopSquare]} />
            <ThemedText style={styles.buttonText}>
              {isRecording ? "STOP" : "MIC"}
            </ThemedText>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  micButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minWidth: 112,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#9f3535",
    paddingHorizontal: 20,
  },
  stopButton: {
    backgroundColor: "#6d2929",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },
  stopSquare: {
    borderRadius: 2,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  disabled: {
    opacity: 0.68,
  },
  pressed: {
    opacity: 0.78,
  },
});
