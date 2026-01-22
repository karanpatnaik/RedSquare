import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const [verificationSent, setVerificationSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
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
      setUserEmail(fullEmail);

      // Check if NetID already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .ilike("net_id", netId.toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        setError("This NetID is already registered. Please sign in instead.");
        setIsSubmitting(false);
        return;
      }

      // Sign up with email verification required
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: fullEmail,
        password,
        options: {
          data: { 
            name: fullName.trim(), 
            net_id: netId.toLowerCase() 
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.includes("User already registered")) {
          setError("This email is already registered. Please sign in instead.");
        } else {
          setError(signUpError.message || "Failed to create account.");
        }
        setIsSubmitting(false);
        return;
      }
      
      if (!authData.user) {
        setError("Failed to create user account. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // If there's a session, email confirmation is disabled
      if (authData.session) {
        Alert.alert(
          "Account Created",
          "Your account has been created successfully.",
          [{ text: "OK", onPress: () => router.replace("/") }]
        );
      } else {
        // Expected path - email confirmation required
        setVerificationSent(true);
      }

      setFullName("");
      setNetId("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) {
        Alert.alert("Error", error.message || "Failed to resend verification email.");
      } else {
        Alert.alert("Success", "Verification email sent! Please check your inbox.");
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to resend verification email.");
    }
  };

  if (verificationSent) {
    return (
      <AuthLayout
        footer={
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Didn't receive the email? Check your spam folder.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Resend verification email"
              onPress={handleResendVerification}
              style={styles.resendButton}
            >
              <GradientText fontSize={typography.sizes.sm}>Resend Email</GradientText>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Return to sign up"
              onPress={() => {
                setVerificationSent(false);
                router.replace("/signup");
              }}
              style={styles.marginTop}
            >
              <Text style={styles.returnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>📧</Text>
          <View style={styles.centerTitle}>
            <GradientText fontFamily={typography.fonts.semibold} fontSize={typography.sizes.xxxl}>
              Verify Your Email
            </GradientText>
          </View>
          <Text style={styles.successText}>
            We've sent a verification link to
          </Text>
          <Text style={styles.emailText}>{userEmail}</Text>
          <Text style={styles.instructionText}>
            Please check your Georgetown email inbox and click the verification link to activate your account.
          </Text>
          <Text style={styles.warningText}>
            ⚠️ You must verify your email before you can sign in.
          </Text>
          <PrimaryButton 
            title="Go to Sign In" 
            onPress={() => router.replace("/")} 
          />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      footer={
        <View style={styles.footerContainer}>
          <Text style={styles.footerTextSmall}>
            Only Georgetown University students, faculty, and staff with valid NetIDs can access RedSquare.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Return to sign in"
            onPress={() => router.replace("/")}
          >
            <Text style={styles.returnLinkText}>Return to Sign In</Text>
          </TouchableOpacity>
        </View>
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
          autoComplete={Platform.OS === 'web' ? 'off' : 'name'}
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
          placeholder="Create a password"
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
          autoComplete={Platform.OS === 'web' ? 'off' : 'password'}
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
          textContentType="none"
          autoComplete={Platform.OS === 'web' ? 'off' : 'password'}
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
  footerContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  footerText: {
    textAlign: "center",
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    lineHeight: typography.lineHeights.md,
  },
  footerTextSmall: {
    textAlign: "center",
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  returnLinkText: {
    textAlign: "center",
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primaryDark,
  },
  returnText: {
    textAlign: "center",
    fontSize: typography.sizes.sm,
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
    alignItems: "center",
  },
  successText: {
    textAlign: "center",
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  emailText: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  instructionText: {
    textAlign: "center",
    marginBottom: spacing.md,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    lineHeight: typography.lineHeights.lg,
  },
  warningText: {
    textAlign: "center",
    marginBottom: spacing.lg,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
    lineHeight: typography.lineHeights.lg,
  },
  resendButton: {
    marginTop: spacing.sm,
  },
  marginTop: {
    marginTop: spacing.xs,
  },
});