// app/newPassword.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import Icon1 from "react-native-vector-icons/Feather";
import { supabase } from "../lib/supabase";
import GradientText from "../components/GradientText";
import { colors, radii, spacing, typography } from "../styles/tokens";

export default function NewPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const router = useRouter();

  // 🔄 Animation values
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = (scale: any, opacity: any, s1: number, s2: number, dur: number) => {
      scale.value = withRepeat(
        withSequence(
          withTiming(s1, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          withTiming(s2, { duration: dur, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: dur, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    };
    pulse(scale1, opacity1, 1.2, 1, 2000);
    pulse(scale2, opacity2, 1.3, 1, 2500);
    pulse(scale3, opacity3, 1.15, 1, 3000);
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));
  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));
  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  const validatePassword = (password: string) => {
    // At least 8 characters
    return password.length >= 8;
  };

  const validateForm = () => {
    if (!validatePassword(newPassword)) {
      return false;
    }
    if (newPassword !== confirmPassword) {
      return false;
    }
    return true;
  };

  const handleUpdatePassword = async () => {
    if (!validateForm()) {
      if (!validatePassword(newPassword)) {
        Alert.alert(
          "Invalid Password",
          "Password must be at least 8 characters long.",
          [{ text: "OK" }]
        );
      } else if (newPassword !== confirmPassword) {
        Alert.alert(
          "Passwords Don't Match",
          "Please make sure both passwords match.",
          [{ text: "OK" }]
        );
      }
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert(
          "Error",
          error.message || "Failed to update password. Please try again.",
          [{ text: "OK" }]
        );
      } else {
        setPasswordUpdated(true);
      }
    } catch (err) {
      Alert.alert(
        "Error",
        "An unexpected error occurred. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen after password update
  if (passwordUpdated) {
    return (
      <View style={styles.container}>
        {/* Animated circles */}
        <Animated.View style={[styles.circle1, animatedStyle1]} />
        <Animated.View style={[styles.circle2, animatedStyle2]} />
        <Animated.View style={[styles.circle3, animatedStyle3]} />

        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✓</Text>

          <View style={styles.centerTitle}>
            <GradientText fontFamily="Jost_500Medium" fontSize={32} width={300}>
              Password Updated
            </GradientText>
          </View>

          <Text style={styles.successText}>
            Your password has been successfully updated.
          </Text>
          <Text style={styles.instructionText}>
            You can now sign in with your new password.
          </Text>

          <TouchableOpacity onPress={() => router.replace("/")} style={styles.button}>
            <Text style={styles.buttonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated circles */}
      <Animated.View style={[styles.circle1, animatedStyle1]} />
      <Animated.View style={[styles.circle2, animatedStyle2]} />
      <Animated.View style={[styles.circle3, animatedStyle3]} />

      <View style={styles.headerRow}>
        <GradientText fontFamily="Jost_500Medium" fontSize={36}>
          Set New Password
        </GradientText>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.description}>
          Enter your new password below. Make sure it's at least 8 characters long.
        </Text>

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
            secureTextEntry={!isVisible}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isVisible ? "Hide password" : "Show password"}
            onPress={() => setIsVisible(!isVisible)}
            style={styles.iconButton}
          >
            <Icon1 name={isVisible ? "eye" : "eye-off"} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            secureTextEntry={!isVisibleConfirm}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isVisibleConfirm ? "Hide password" : "Show password"}
            onPress={() => setIsVisibleConfirm(!isVisibleConfirm)}
            style={styles.iconButton}
          >
            <Icon1 name={isVisibleConfirm ? "eye" : "eye-off"} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleUpdatePassword}
          style={[
            styles.button,
            (!validateForm() || isLoading) && styles.buttonDisabled
          ]}
          disabled={!validateForm() || isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Updating..." : "Update Password"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom notice with thin red line */}
      <View style={styles.bottomNotice}>
        <View style={styles.redDivider} />
        <View style={styles.bottomResendRow}>
          <Text style={styles.footerText}>Remember your password?</Text>
          <TouchableOpacity onPress={() => router.replace("/")} style={{ marginLeft: spacing.xs }}>
            <GradientText fontSize={12}>Sign In</GradientText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: "center",
    overflow: "hidden",
  },
  circle1: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.accentOne,
    top: -120,
    left: -80,
  },
  circle2: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.accentTwo,
    top: -80,
    right: -60,
  },
  circle3: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.accentThree,
    bottom: -110,
    left: -40,
  },
  formContainer: {
    marginBottom: spacing.huge,
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xxxl,
    lineHeight: typography.lineHeights.lg,
    fontFamily: typography.fonts.regular,
  },
  headerRow: {
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: "600",
    marginBottom: spacing.sm,
    color: colors.text,
    fontFamily: typography.fonts.semibold,
  },
  inputContainer: {
    position: "relative",
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingRight: 48,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
  },
  iconButton: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    padding: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    padding: spacing.lg,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
  },
  buttonText: {
    color: colors.surface,
    fontSize: typography.sizes.lg,
    fontWeight: "600",
    fontFamily: typography.fonts.semibold,
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: typography.lineHeights.sm,
    fontFamily: typography.fonts.regular,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
    color: colors.success,
  },
  successText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontFamily: typography.fonts.regular,
  },
  instructionText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xxxl,
    lineHeight: typography.lineHeights.xl,
    paddingHorizontal: spacing.xl,
    fontFamily: typography.fonts.regular,
  },
  centerTitle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.xl,
  },
  bottomNotice: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  redDivider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.primary,
    marginBottom: spacing.xl,
  },
  bottomResendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
