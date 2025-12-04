// components/common/Card.tsx
import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, borderRadius, spacing, shadows } from "@/theme";

interface CardProps {
  children: React.ReactNode;
  variant?: "elevated" | "outlined" | "filled";
  style?: ViewStyle;
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "elevated",
  style,
  padding = "md",
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  elevated: {
    backgroundColor: colors.background.paper,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filled: {
    backgroundColor: colors.neutral.gray50,
  },
});
