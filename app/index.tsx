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
      const { data: profileCheck, error: profileErr } = await supabase
        .from("profiles")
        .select("id")
        .ilike("net_id", netId.toLowerCase())
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profileCheck) {
        return setError("No account found for this NetID. Please sign up first.");
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: fullEmail,
        password,
      });

      if (signInErr) {
        if (signInErr.message.toLowerCase().includes("invalid login")) {
          return setError("Incorrect password. Please try again.");
        }
        throw signInErr;
      }

      // Fetch fresh user data to check email verification status
      const { data: userData, error: userErr } = await supabase.auth.getUser();

      if (userErr || !userData.user) {
        await supabase.auth.signOut();
        throw new Error("Failed to verify account status.");
      }

      // Check if email has been verified
      if (!userData.user.email_confirmed_at) {
        await supabase.auth.signOut();
        return setError("Please verify your Georgetown email before signing in. Check your inbox for the verification link.");
      }

      router.replace("/bulletin");
    } catch (err: any) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
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
            <Text style={styles.footerPrompt}>Don&apos;t have an account?</Text>
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
            placeholder="Enter your password"
            secureTextEntry={!isVisible}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="password"
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

          {error ? <Text style={styles.formError}>{error}</Text> : null}

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
    alignItems: "center",
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
