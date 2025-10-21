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
import Icon1 from 'react-native-vector-icons/Feather';
import GradientText from "./GradientText";

export default function SignUpPage() {
  const [netId, setNetId] = useState("");
  const [password, setPassword] = useState("");
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Animation values
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);

  useEffect(() => {
    // Pulsing animation for decorative circles
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    scale2.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    scale3.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity2.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity3.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
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

  const validateNetId = (netId: string) => {
    const netIdRegex = /^[a-zA-Z0-9]{2,20}$/;
    return netId.trim().length > 0 && netIdRegex.test(netId.trim());
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSignUp = () => {
    if (!validateNetId(netId)) {
      setError("Please enter a valid Georgetown NetID.");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);

    const fullEmail = `${netId.toLowerCase()}@georgetown.edu`;

    // TODO: Implement actual sign-up logic with Supabase
    // For now, navigate to home
    router.replace("/home");
  };

  return (
    <View style={styles.container}>
      {/* Animated background circles */}
      <Animated.View style={[styles.circle1, animatedStyle1]} />
      <Animated.View style={[styles.circle2, animatedStyle2]} />
      <Animated.View style={[styles.circle3, animatedStyle3]} />

      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <GradientText fontFamily="Jost_500Medium" fontSize={44}>
            Join RedSquare
          </GradientText>
        </View>

        <Text style={styles.subtitle}>Create your Georgetown account</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Georgetown NetID</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="NetID"
              value={netId}
              onChangeText={setNetId}
              style={styles.tfInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.domainText}>@georgetown.edu</Text>
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              secureTextEntry={isVisible}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              style={styles.tfInput}
              autoCapitalize="none"
              autoCorrect={false}

            />
          <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={{ padding: 8 }}>
              <Icon1 name= {(isVisible) ? "eye" : "eye-off"} size={20} color="#666" style={{ marginRight: 12 }} />
          </TouchableOpacity>   
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              secureTextEntry={isVisibleConfirm}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.tfInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          <TouchableOpacity onPress={() => setIsVisibleConfirm(!isVisibleConfirm)} style={{ padding: 8 }}>
              <Icon1 name= {(isVisibleConfirm) ? "eye" : "eye-off"} size={20} color="#666" style={{ marginRight: 12 }} />
          </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity onPress={handleSignUp} style={styles.button}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Only Georgetown University students, faculty, and staff with valid NetIDs can access RedSquare.
        </Text>
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
  content: {
    zIndex: 10,
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 20,
  },
  backText: {
    fontSize: 16,
    color: "#D74A4A",
    fontFamily: "Jost_500Medium",
  },
  headerRow: {
    paddingLeft: 68,
    marginLeft: 30,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    fontFamily: "Jost_400Regular",
  },
  formContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
    fontFamily: "Jost_500Medium",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  tfInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: "Jost_400Regular",
  },
  domainText: {
    color: "#666",
    fontSize: 16,
    paddingRight: 12,
    fontFamily: "Jost_400Regular",
  },
  error: {
    fontFamily: 'Jost_500Medium',
    color: '#D74A4A',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#D74A4A',
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
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
  // Animated circles
  circle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#D74A4A",
    top: -50,
    right: -50,
    zIndex: 1,
  },
  circle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#9C2C2C",
    bottom: 100,
    left: -40,
    zIndex: 1,
  },
  circle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#932A2A",
    top: '40%',
    right: -30,
    zIndex: 1,
  },
});
