import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon1 from "react-native-vector-icons/Feather";
import AuthLayout from "../components/auth/AuthLayout";
import PrimaryButton from "../components/buttons/PrimaryButton";
import TextField from "../components/forms/TextField";
import GradientText from "../components/GradientText";
import { supabase } from "../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../styles/tokens";

export default function SignInPage() {
  const [netId, setNetId] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [touched, setTouched] = useState({ netId: false, password: false });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const validateNetId = (value: string) => /^[a-zA-Z0-9]{2,20}$/.test(value.trim());

  const netIdError = useMemo(() => {
    if (!touched.netId) return "";
    if (!netId.trim()) return "NetID is required.";
    if (!validateNetId(netId)) return "NetID must be 2-20 letters or numbers.";
    return "";
  }, [netId, touched.netId]);

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (!password.trim()) return "Password is required.";
    return "";
  }, [password, touched.password]);

  const canSubmit = validateNetId(netId) && password.trim().length > 0;

  const handleSignIn = async () => {
    if (isSubmitting) return;
    setTouched({ netId: true, password: true });
    setError(null);
    if (!canSubmit) return;

    const fullEmail = `${netId.toLowerCase()}@georgetown.edu`;

    setIsSubmitting(true);
    try {
      // Attempt sign in
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: fullEmail,
        password,
      });

      if (signInErr) {
        console.log("Sign in error:", signInErr);
        
        if (signInErr.message.toLowerCase().includes("invalid login") || 
            signInErr.message.toLowerCase().includes("invalid credentials")) {
          return setError("Incorrect NetID or password. Please try again.");
        }
        
        if (signInErr.message.toLowerCase().includes("email not confirmed")) {
          return setError("Please verify your Georgetown email before signing in. Check your inbox for the verification link.");
        }
        
        return setError(signInErr.message || "Unable to sign in. Please try again.");
      }

      if (!data.user) {
        return setError("Sign in failed. Please try again.");
      }

      console.log("User email_confirmed_at:", data.user.email_confirmed_at);
      
      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        return setError("Please verify your Georgetown email before signing in. Check your inbox for the verification link.");
      }

      router.replace("/bulletin");
    } catch (err: any) {
      console.error("Unexpected sign in error:", err);
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!validateNetId(netId)) {
      setError("Please enter your NetID to resend verification email.");
      return;
    }

    const fullEmail = `${netId.toLowerCase()}@georgetown.edu`;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: fullEmail,
      });

      if (error) throw error;
      
      setError(null);
      alert("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    }
  };

  return (
    <AuthLayout
      footer={
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Only Georgetown University students, faculty, and staff with valid NetIDs can access RedSquare.
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>Don't have an account?</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go to sign up"
              onPress={() => router.push("/signup")}
            >
              <GradientText fontSize={typography.sizes.sm}>Sign Up</GradientText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
            onPress={() => router.push("/forgotPassword")}
          >
            <GradientText fontSize={typography.sizes.sm}>Forgot Password?</GradientText>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.gradientTitle}>
            <GradientText
              fontFamily={typography.fonts.medium}
              fontSize={typography.sizes.display}
            >
              RedSquare
            </GradientText>
          </View>
          <Text style={styles.subtitle}>Sign in with your Georgetown NetID.</Text>
        </View>

        <View style={styles.card}>
          <TextField
            label="Georgetown NetID"
            value={netId}
            onChangeText={setNetId}
            onBlur={() => setTouched((prev) => ({ ...prev, netId: true }))}
            placeholder="NetID"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete={Platform.OS === 'web' ? 'off' : 'username'}
            returnKeyType="next"
            errorText={netIdError}
            rightElement={<Text style={styles.domainText}>@georgetown.edu</Text>}
            accessibilityLabel="Georgetown NetID"
          />

          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            placeholder="Enter your password"
            secureTextEntry={!isVisible}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="none"
            autoComplete={Platform.OS === 'web' ? 'off' : 'password'}
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
            errorText={passwordError}
            accessibilityLabel="Password"
            rightElement={
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={isVisible ? "Hide password" : "Show password"}
                onPress={() => setIsVisible(!isVisible)}
                style={styles.iconButton}
              >
                <Icon1 name={isVisible ? "eye" : "eye-off"} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            }
          />

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.formError}>{error}</Text>
              {error.toLowerCase().includes("verify") && (
                <TouchableOpacity 
                  onPress={handleResendVerification}
                  style={styles.resendButton}
                >
                  <Text style={styles.resendText}>Resend verification email</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <PrimaryButton
            title="Sign In"
            onPress={handleSignIn}
            loading={isSubmitting}
            disabled={!canSubmit}
          />
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
    width: "100%",
    alignSelf: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    textAlign: "center",
  },
  gradientTitle: {
    textAlign: "center",
    width: "100%",
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
  iconButton: {
    padding: spacing.xs,
  },
  errorContainer: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  formError: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
  },
  resendButton: {
    alignSelf: "flex-start",
  },
  resendText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.primaryDark,
    textDecorationLine: "underline",
  },
  footerContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  footerText: {
    textAlign: "center",
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  footerPrompt: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
});