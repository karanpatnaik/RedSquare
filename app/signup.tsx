import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon1 from "react-native-vector-icons/Feather";
import AuthLayout from "../components/auth/AuthLayout";
import PrimaryButton from "../components/buttons/PrimaryButton";
import TextField from "../components/forms/TextField";
import GradientText from "../components/GradientText";
import { supabase } from "../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../styles/tokens";

export default function SignUpPage() {
  const [netId, setNetId] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    netId: false,
    password: false,
    confirmPassword: false,
  });
  const router = useRouter();

  const validateNetId = (value: string) => /^[a-zA-Z0-9]{2,20}$/.test(value.trim());
  const validatePassword = (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

  const fullNameError = useMemo(() => {
    if (!touched.fullName) return "";
    if (!fullName.trim()) return "Full name is required.";
    return "";
  }, [fullName, touched.fullName]);

  const netIdError = useMemo(() => {
    if (!touched.netId) return "";
    if (!netId.trim()) return "NetID is required.";
    if (!validateNetId(netId)) return "NetID must be 2-20 letters or numbers.";
    return "";
  }, [netId, touched.netId]);

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (!password.trim()) return "Password is required.";
    if (!validatePassword(password)) return "Use 8+ chars with upper, lower, and number.";
    return "";
  }, [password, touched.password]);

  const confirmError = useMemo(() => {
    if (!touched.confirmPassword) return "";
    if (!confirmPassword.trim()) return "Confirm your password.";
    if (confirmPassword !== password) return "Passwords do not match.";
    return "";
  }, [confirmPassword, password, touched.confirmPassword]);

  const canSubmit =
    fullName.trim().length > 0 &&
    validateNetId(netId) &&
    validatePassword(password) &&
    confirmPassword === password;

  const handleSignUp = async () => {
    if (isSubmitting) return;
    setTouched({ fullName: true, netId: true, password: true, confirmPassword: true });
    setError(null);
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const fullEmail = `${netId.toLowerCase()}@georgetown.edu`;

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: fullEmail,
        password,
        options: { data: { name: fullName.trim(), net_id: netId.toLowerCase() } },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Failed to create user account");

      setFullName("");
      setNetId("");
      setPassword("");
      setConfirmPassword("");
      setAccountCreated(true);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accountCreated) {
    return (
      <AuthLayout>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>📧</Text>
          <GradientText fontFamily={typography.fonts.semibold} fontSize={typography.sizes.xxxl}>
            Verify Your Email
          </GradientText>
          <Text style={styles.successText}>
            We've sent a verification link to your Georgetown email. Please check your inbox and click the link to activate your account.
          </Text>
          <Text style={styles.successTextSmall}>
            You must verify your email before you can sign in.
          </Text>
          <PrimaryButton title="Go to Sign In" onPress={() => router.replace("/")} />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      footer={
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Return to log in"
          onPress={() => router.replace("/")}
        >
          <Text style={styles.returnLinkText}>Return to Log In</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.header}>
        <GradientText fontFamily={typography.fonts.medium} fontSize={typography.sizes.display}>
          Join RedSquare
        </GradientText>
        <Text style={styles.subtitle}>Create your Georgetown account.</Text>
      </View>

      <View style={styles.card}>
        <TextField
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
          placeholder="Enter your name"
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
          returnKeyType="next"
          errorText={fullNameError}
          accessibilityLabel="Full Name"
        />

        <TextField
          label="Georgetown NetID"
          value={netId}
          onChangeText={setNetId}
          onBlur={() => setTouched((prev) => ({ ...prev, netId: true }))}
          placeholder="NetID"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          autoComplete="username"
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
          placeholder="Create a password"
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          autoComplete="password-new"
          returnKeyType="next"
          helperText="Use 8+ chars with upper, lower, and number."
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

        <TextField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
          placeholder="Re-enter your password"
          secureTextEntry={!isVisibleConfirm}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
          errorText={confirmError}
          accessibilityLabel="Confirm Password"
          rightElement={
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isVisibleConfirm ? "Hide password" : "Show password"}
              onPress={() => setIsVisibleConfirm(!isVisibleConfirm)}
              style={styles.iconButton}
            >
              <Icon1 name={isVisibleConfirm ? "eye" : "eye-off"} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          }
        />

        {error ? <Text style={styles.formError}>{error}</Text> : null}

        <PrimaryButton
          title="Create Account"
          onPress={handleSignUp}
          loading={isSubmitting}
          disabled={!canSubmit}
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
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.soft,
  },
  iconButton: {
    padding: spacing.xs,
  },
  domainText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  formError: {
    marginBottom: spacing.md,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
  },
  returnLinkText: {
    textAlign: "center",
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primaryDark,
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
  successText: {
    textAlign: "center",
    marginVertical: spacing.md,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  successTextSmall: {
    textAlign: "center",
    marginBottom: spacing.lg,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
  },
});
