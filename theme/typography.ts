// theme/typography.ts
export const typography = {
  // Font families
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
    semiBold: "System",
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
  },

  // Text styles
  h1: {
    fontSize: 36,
    fontWeight: "700" as const,
    lineHeight: 44,
  },
  h2: {
    fontSize: 30,
    fontWeight: "700" as const,
    lineHeight: 38,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  h6: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
  },

  body1: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 21,
  },

  subtitle1: {
    fontSize: 16,
    fontWeight: "500" as const,
    lineHeight: 24,
  },
  subtitle2: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 21,
  },

  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 18,
  },

  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
    textTransform: "none" as const,
  },
};
