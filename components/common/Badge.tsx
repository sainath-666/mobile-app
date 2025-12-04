// components/common/Badge.tsx
import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, typography, borderRadius, spacing } from "@/theme";

interface BadgeProps {
  label: string;
  variant?: "success" | "error" | "warning" | "info" | "neutral";
  size?: "small" | "medium";
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "neutral",
  size = "medium",
  style,
}) => {
  return (
    <View style={[styles.base, styles[variant], styles[size], style]}>
      <Text
        style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignSelf: "flex-start",
  },
  success: {
    backgroundColor: colors.success.background,
  },
  error: {
    backgroundColor: colors.error.background,
  },
  warning: {
    backgroundColor: colors.warning.background,
  },
  info: {
    backgroundColor: colors.info.background,
  },
  neutral: {
    backgroundColor: colors.neutral.gray100,
  },
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontWeight: typography.fontWeight.semiBold,
  },
  successText: {
    color: colors.success.dark,
  },
  errorText: {
    color: colors.error.dark,
  },
  warningText: {
    color: colors.warning.dark,
  },
  infoText: {
    color: colors.info.dark,
  },
  neutralText: {
    color: colors.text.primary,
  },
  smallText: {
    fontSize: typography.fontSize.xs,
  },
  mediumText: {
    fontSize: typography.fontSize.sm,
  },
});
