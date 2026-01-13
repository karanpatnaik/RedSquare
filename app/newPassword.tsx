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
import { supabase } from "../lib/supabase";
import GradientText from "../components/GradientText";

export default function NewPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        <TextInput
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

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
          <TouchableOpacity onPress={() => router.replace("/")} style={{ marginLeft: 4 }}>
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
    backgroundColor: "#fffcf4",
    padding: 20,
    justifyContent: "center",
    overflow: "hidden",
  },
  // Animated background circles
  circle1: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#FDE8E8',
    top: -120,
    left: -80,
  },
  circle2: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FBE5E5',
    top: -80,
    right: -60,
  },
  circle3: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FCECEC',
    bottom: -110,
    left: -40,
  },
  formContainer: {
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
    fontFamily: "Jost_400Regular",
  },
  headerRow: {
    alignItems: 'center',
    width: '100%',
    marginLeft: 53,
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
    fontFamily: "Jost_600SemiBold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    fontFamily: "Jost_400Regular",
  },
  button: {
    backgroundColor: "#D74A4A",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Jost_600SemiBold",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
    fontFamily: "Jost_400Regular",
  },
  // Success state styles
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 20,
    color: "#4CAF50",
  },
  successText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 8,
    fontFamily: "Jost_400Regular",
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 20,
    fontFamily: "Jost_400Regular",
  },
  centerTitle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginLeft: 13,
    marginBottom: 20,
  },
  bottomNotice: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fffcf4',
  },
  redDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#D74A4A',
    marginBottom: 20,
  },
  bottomResendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
