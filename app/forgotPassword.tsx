import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AuthLayout from "../components/auth/AuthLayout";
import PrimaryButton from "../components/buttons/PrimaryButton";
import TextField from "../components/forms/TextField";
import GradientText from "../components/GradientText";
import { supabase } from "../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../styles/tokens";

export default function ForgotPasswordPage() {
  const [netId, setNetId] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [touched, setTouched] = useState(false);
  const router = useRouter();

  const validateNetId = (value: string) => /^[a-zA-Z0-9]{2,20}$/.test(value.trim());

  const netIdError = useMemo(() => {
    if (!touched) return "";
    if (!netId.trim()) return "NetID is required.";
    if (!validateNetId(netId)) return "NetID must be 2-20 letters or numbers.";
    return "";
  }, [netId, touched]);

  const handleSendResetLink = async () => {
    if (isSending) return;
    setTouched(true);
    if (!validateNetId(netId)) return;

    setIsSending(true);
    const email = `${netId.toLowerCase()}@georgetown.edu`;

    try {
      const redirectUrl = Linking.createURL('newPassword'); // creates a valid URL for dev / custom scheme
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        Alert.alert("Error", error.message || "Failed to send reset email.");
        setIsSending(false);
      } else {
        setEmailSent(true);
        setIsSending(false);
      }
    } catch (err) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      setIsSending(false);
    }
  };

  const handleResend = async () => {
    setEmailSent(false);
    await handleSendResetLink();
  };

  if (emailSent) {
    return (
      <AuthLayout
        footer={
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Resend reset email"
            onPress={handleResend}
            style={styles.resendRow}
            disabled={isSending}
          >
            <Text style={styles.resendText}>Didn&apos;t receive the email?</Text>
            <GradientText fontSize={typography.sizes.sm}>
              {isSending ? "Sending..." : "Resend"}
            </GradientText>
          </TouchableOpacity>
        }
      >
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✓</Text>

          <View style={styles.centerTitle}>
            <GradientText fontFamily={typography.fonts.medium} fontSize={typography.sizes.xxxl} width={260}>
              Check your email
            </GradientText>
          </View>

          <Text style={styles.successText}>We sent a password reset link to</Text>
          <Text style={styles.emailText}>{netId.toLowerCase()}@georgetown.edu</Text>
          <Text style={styles.instructionText}>The link will expire in 24 hours.</Text>

          <PrimaryButton title="Back to Sign In" onPress={() => router.back()} />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Remember your password?</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
            onPress={() => router.back()}
          >
            <GradientText fontSize={typography.sizes.xs}>Sign In</GradientText>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.header}>
        <GradientText fontFamily={typography.fonts.medium} fontSize={typography.sizes.xxxl}>
          Reset Password
        </GradientText>
      </View>

      <View style={styles.card}>
        <Text style={styles.description}>
          Enter your Georgetown NetID and we&apos;ll send you a link to reset your password.
        </Text>

        <TextField
          label="Georgetown NetID"
          value={netId}
          onChangeText={setNetId}
          onBlur={() => setTouched(true)}
          placeholder="NetID"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          textContentType="username"
          autoComplete="username"
          returnKeyType="done"
          onSubmitEditing={handleSendResetLink}
          errorText={netIdError}
          rightElement={<Text style={styles.domainText}>@georgetown.edu</Text>}
          accessibilityLabel="Georgetown NetID"
        />

        <PrimaryButton
          title="Send Reset Link"
          onPress={handleSendResetLink}
          loading={isSending}
          disabled={!validateNetId(netId)}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeights.lg,
    fontFamily: typography.fonts.regular,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.soft,
  },
  domainText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
  },
  footerText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  successContainer: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.soft,
  },
  successEmoji: {
    fontSize: typography.sizes.xxxl,
    marginBottom: spacing.md,
  },
  centerTitle: {
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    textAlign: "center",
  },
  emailText: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.text,
  },
  instructionText: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  resendText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
});