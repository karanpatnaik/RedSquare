import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
import GradientText from "./GradientText";

export default function SignUpPage() {
  const [netId, setNetId] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
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

  const validateNetId = (netId: string) => /^[a-zA-Z0-9]{2,20}$/.test(netId.trim());
  const validatePassword = (pw: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw);

  const handleSignUp = async () => {
    if (!fullName.trim()) return setError("Please enter your full name.");
    if (!validateNetId(netId)) return setError("Please enter a valid Georgetown NetID.");
    if (!validatePassword(password))
      return setError("Password must be at least 8 characters with uppercase, lowercase, and number.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setError(null);
    setLoading(true);

    try {
      const fullEmail = `${netId.toLowerCase()}@georgetown.edu`;

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: fullEmail,
        password,
        options: { data: { name: fullName.trim(), net_id: netId.toLowerCase() } },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Failed to create user account");

      // ✅ Clear form + show success view
      setFullName("");
      setNetId("");
      setPassword("");
      setConfirmPassword("");
      setAccountCreated(true);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🎉 Success screen
  if (accountCreated) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <GradientText fontFamily="Jost_600SemiBold" fontSize={36}>
            Account Created!
          </GradientText>
          <Text style={styles.successText}>
            Your RedSquare account has been successfully created.
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


      <View style={styles.content}>
        <View style={styles.headerRow}>
          <GradientText fontFamily="Jost_500Medium" fontSize={44}>
            Join RedSquare
          </GradientText>
        </View>

        <Text style={styles.subtitle}>Create your Georgetown account</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter your name"
              value={fullName}
              onChangeText={setFullName}
              style={styles.tfInput}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>Georgetown NetID</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="NetID"
              value={netId}
              onChangeText={setNetId}
              style={styles.tfInput}
              autoCapitalize="none"
            />
            <Text style={styles.domainText}>@georgetown.edu</Text>
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              secureTextEntry={!isVisible}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              style={styles.tfInput}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={{ padding: 8 }}>
              <Icon1 name={isVisible ? "eye" : "eye-off"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              secureTextEntry={!isVisibleConfirm}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.tfInput}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setIsVisibleConfirm(!isVisibleConfirm)}
              style={{ padding: 8 }}
            >
              <Icon1 name={isVisibleConfirm ? "eye" : "eye-off"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={handleSignUp}
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating Account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Return to Log In button */}
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={styles.returnLink}
          >
            <Text style={styles.returnLinkText}>Return to Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ✅ Added missing "content" and "formContainer" styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffcf4", padding: 20, justifyContent: "center", overflow: "hidden" },
  content: { zIndex: 10 },
  formContainer: { marginBottom: 30 },
  headerRow: {
    paddingLeft: 68,
    marginLeft: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  subtitle: { fontSize: 18, color: "#666", textAlign: "center", marginBottom: 40 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#333" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  tfInput: { flex: 1, padding: 12, fontSize: 16 },
  domainText: { color: "#666", fontSize: 16, paddingRight: 12 },
  button: { backgroundColor: "#D74A4A", borderRadius: 8, padding: 16, alignItems: "center", marginTop: 10 },
  buttonDisabled: { backgroundColor: "#999", opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  error: { color: "#D74A4A", fontSize: 14, marginBottom: 12 },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  successEmoji: { fontSize: 60, marginBottom: 20 },
  successText: { fontSize: 16, textAlign: "center", color: "#666", marginBottom: 20, paddingHorizontal: 20 },
  circle1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#D74A4A", top: -50, right: -50 },
  circle2: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "#9C2C2C", bottom: 100, left: -40 },
  circle3: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "#932A2A", top: "40%", right: -30 },
  backButton: { position: "absolute", top: 60, left: 20 },
  backText: { fontSize: 16, color: "#D74A4A" },

  // new styles
  returnLink: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  returnLinkText: {
    color: "#9C2C2C",
    fontSize: 16,
    fontFamily: "Jost_500Medium",
  },
});
