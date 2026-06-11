import { StyleSheet, TextInput } from "react-native";

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Editor({
  content,
  editable,
  onChangeText,
}: {
  content: string;
  editable: boolean;
  onChangeText: (value: string) => void;
}) {
  const theme = useTheme();

  return (
    <TextInput
      accessibilityLabel="Document editor"
      editable={editable}
      maxFontSizeMultiplier={1.3}
      multiline
      onChangeText={onChangeText}
      placeholder="Start writing..."
      placeholderTextColor={theme.textSecondary}
      scrollEnabled
      selectionColor="#8f6b43"
      style={[
        styles.editor,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text,
        },
        !editable && styles.disabled,
      ]}
      textAlignVertical="top"
      value={content}
    />
  );
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontFamily: Fonts.serif,
    fontSize: 18,
    lineHeight: 29,
  },
  disabled: {
    opacity: 0.8,
  },
});
