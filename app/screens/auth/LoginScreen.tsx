// app/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "@/components/common";
import { colors, typography, spacing, borderRadius } from "@/theme";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/authStorage";

type LoginResponse = {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: "user" | "owner";
  };
};

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      setError("Please enter email/phone and password");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post<LoginResponse>("/api/auth/login", {
        emailOrPhone,
        password,
      });

      const { token, user } = res.data;
      await saveAuth(token, user);

      Alert.alert(
        "✨ Welcome Back!",
        `Logged in as ${user.name}`,
        [
          {
            text: "Continue",
            onPress: () => router.back(),
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      console.log("Login error:", err.response?.data || err.message);
      const msg =
        err.response?.data?.message ||
        "Login failed. Please check credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary.main, colors.primary.dark]}
        style={styles.header}
      >
        <Animatable.View animation="fadeInDown" duration={1000}>
          <Ionicons name="home" size={64} color={colors.neutral.white} />
          <Text style={styles.headerTitle}>PG Finder</Text>
          <Text style={styles.headerSubtitle}>Find your perfect stay</Text>
        </Animatable.View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animatable.View animation="fadeInUp" duration={800} delay={300}>
            <View style={styles.formCard}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your journey
              </Text>

              <View style={styles.inputsContainer}>
                <Input
                  label="Email or Phone"
                  placeholder="Enter your email or phone"
                  value={emailOrPhone}
                  onChangeText={(text) => {
                    setEmailOrPhone(text);
                    setError("");
                  }}
                  leftIcon="person-outline"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={error && !password ? error : undefined}
                />

                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError("");
                  }}
                  leftIcon="lock-closed-outline"
                  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  error={error && password ? error : undefined}
                />
              </View>

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                fullWidth
                style={styles.loginButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Demo Credentials</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.demoBox}>
                <View style={styles.demoItem}>
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color={colors.primary.main}
                  />
                  <View style={styles.demoTextContainer}>
                    <Text style={styles.demoLabel}>User:</Text>
                    <Text style={styles.demoValue}>
                      user1@example.com / password123
                    </Text>
                  </View>
                </View>
                <View style={styles.demoItem}>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={colors.secondary.main}
                  />
                  <View style={styles.demoTextContainer}>
                    <Text style={styles.demoLabel}>Owner:</Text>
                    <Text style={styles.demoValue}>
                      owner1@example.com / password123
                    </Text>
                  </View>
                </View>
              </View>

              <Button
                title="Go Back"
                onPress={() => router.back()}
                variant="ghost"
                fullWidth
                style={styles.backButton}
              />
            </View>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    paddingTop: spacing["3xl"],
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    borderBottomLeftRadius: borderRadius["2xl"],
    borderBottomRightRadius: borderRadius["2xl"],
  },
  headerTitle: {
    ...typography.h2,
    color: colors.neutral.white,
    marginTop: spacing.md,
  },
  headerSubtitle: {
    ...typography.body1,
    color: colors.neutral.white,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  formContainer: {
    flex: 1,
    marginTop: -spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  formCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  inputsContainer: {
    marginBottom: spacing.md,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginHorizontal: spacing.md,
  },
  demoBox: {
    backgroundColor: colors.neutral.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  demoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  demoTextContainer: {
    flex: 1,
  },
  demoLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semiBold,
  },
  demoValue: {
    ...typography.body2,
    color: colors.text.primary,
    marginTop: 2,
  },
  backButton: {
    marginTop: spacing.md,
  },
});
