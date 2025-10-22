import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon1 from "react-native-vector-icons/Feather";
import { supabase } from "../lib/supabase";
import GradientText from "./GradientText";

export default function SignInPage() {
  const [netId, setNetId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  const validateNetId = (netId: string) => /^[a-zA-Z0-9]{2,20}$/.test(netId.trim());

  const handleSignIn = async () => {
    setError(null);
    if (!validateNetId(netId)) return setError("Please enter a valid Georgetown NetID.");

    const fullEmail = `${netId.toLowerCase()}@georgetown.edu`;

    try {
      // 1️⃣ Check if the account exists in profiles
      const { data: profileCheck, error: profileErr } = await supabase
        .from("profiles")
        .select("id")
        .ilike("net_id", netId.toLowerCase())
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profileCheck)
        return setError("No account found for this NetID. Please sign up first.");

      // 2️⃣ Attempt login via Supabase Auth
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: fullEmail,
        password,
      });

      if (signInErr) {
        if (signInErr.message.toLowerCase().includes("invalid login"))
          return setError("Incorrect password. Please try again.");
        throw signInErr;
      }

      router.replace("/home");
    } catch (err: any) {
      setError(err.message || "Unable to sign in. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <GradientText fontFamily="Jost_500Medium" fontSize={44}>
          RedSquare
        </GradientText>
      </View>

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

        <View style={styles.inputContainer}>
          <TextInput
            secureTextEntry={!isVisible}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.tfInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={{ padding: 8 }}>
            <Icon1 name={isVisible ? "eye" : "eye-off"} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity onPress={handleSignIn} style={styles.button}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          Only Georgetown University students, faculty, and staff with valid NetIDs can
          access RedSquare.
        </Text>
        <View style={styles.signupRow}>
          <Text style={styles.signupPrompt}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <GradientText fontSize={14}>Sign Up</GradientText>
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
  },
  headerRow: {
    alignItems: "center",
    left: 30,
    marginBottom: 100,
  },
  formContainer: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
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
  },
  domainText: {
    color: "#666",
    fontSize: 16,
    paddingRight: 12,
  },
  button: {
    backgroundColor: "#D74A4A",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  error: {
    color: "#D74A4A",
    fontSize: 14,
    marginBottom: 10,
  },
  footerContainer: {
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupPrompt: {
    fontSize: 14,
    color: "#666",
  },
});
