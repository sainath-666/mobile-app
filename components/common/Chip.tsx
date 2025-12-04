// components/common/Chip.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, typography, borderRadius, spacing } from "@/theme";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: "filled" | "outlined";
  size?: "small" | "medium";
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  variant = "outlined",
  size = "medium",
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        selected && styles.selected,
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          styles[`${size}Text`],
          selected && styles.selectedText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.full,
  },
  filled: {
    backgroundColor: colors.neutral.gray100,
  },
  outlined: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border.main,
  },
  small: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  medium: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  selected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  text: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  smallText: {
    fontSize: typography.fontSize.xs,
  },
  mediumText: {
    fontSize: typography.fontSize.sm,
  },
  selectedText: {
    color: colors.neutral.white,
  },
});
