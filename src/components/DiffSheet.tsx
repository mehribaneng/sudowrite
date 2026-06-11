import { BottomSheet, Button, Column, Row, Text } from "@expo/ui";
import { Group, RNHostView } from "@expo/ui/swift-ui";
import {
  controlSize,
  frame,
  presentationBackground,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { Text as RNText, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/hooks/use-theme";
import type { DiffChunk } from "@/store/useStore";

export function DiffSheet({
  command,
  diff,
  visible,
  onApply,
  onReject,
}: {
  command: string;
  diff: DiffChunk[];
  visible: boolean;
  onApply: () => void;
  onReject: () => void;
}) {
  const theme = useTheme();

  return (
    <BottomSheet
      isPresented={visible}
      modifiers={[presentationBackground(theme.surface)]}
      onDismiss={onReject}
      showDragIndicator
      snapPoints={[{ fraction: 0.72 }, "full"]}
    >
      <Column alignment="start" spacing={12}>
        <Text
          textStyle={{
            color: theme.text,
            fontSize: 22,
            fontWeight: "700",
          }}
        >
          Review edit
        </Text>

        {command ? (
          <Text
            numberOfLines={2}
            textStyle={{
              color: theme.textSecondary,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {`Command: "${command}"`}
          </Text>
        ) : null}

        <Group
          modifiers={[
            frame({
              minHeight: 260,
              maxHeight: 620,
              maxWidth: Infinity,
              alignment: "topLeading",
            }),
          ]}
        >
          <RNHostView>
            <View
              style={[
                styles.diffContainer,
                {
                  backgroundColor: theme.surfaceRaised,
                  borderColor: theme.border,
                },
              ]}
            >
              <ScrollView contentContainerStyle={styles.diffContent}>
                <ThemedText type="prose">
                  {diff.map((chunk, index) => (
                    <RNText
                      key={`${index}-${chunk.type}`}
                      style={[
                        chunk.type === "insert" && styles.insert,
                        chunk.type === "delete" && styles.delete,
                      ]}
                    >
                      {chunk.value}
                    </RNText>
                  ))}
                </ThemedText>
              </ScrollView>
            </View>
          </RNHostView>
        </Group>

        <Row
          alignment="center"
          modifiers={[frame({ maxWidth: Infinity })]}
          spacing={12}
        >
          <Button
            label="Reject"
            modifiers={[
              frame({ maxWidth: Infinity }),
              controlSize("large"),
              tint(theme.textSecondary),
            ]}
            onPress={onReject}
            variant="outlined"
          />
          <Button
            label="Apply"
            modifiers={[
              frame({ maxWidth: Infinity }),
              controlSize("large"),
              tint("#2f6b48"),
            ]}
            onPress={onApply}
          />
        </Row>
      </Column>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  diffContainer: {
    flex: 1,
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 12,
  },
  diffContent: {
    padding: 16,
  },
  insert: {
    backgroundColor: "#d9f2df",
    color: "#176b35",
  },
  delete: {
    backgroundColor: "#f8dada",
    color: "#9d2727",
    textDecorationLine: "line-through",
  },
});
