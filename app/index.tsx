import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import GradientText from "./GradientText";

export default function SignInPage() {
  const [netId, setNetId] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const validateNetId = (netId: string) => {
    const netIdRegex = /^[a-zA-Z0-9]{2,20}$/;
    return netId.trim().length > 0 && netIdRegex.test(netId.trim());
  };
  const forgotPassword = () => {
    router.push("/forgotPassword");
    return; 
  }
  const handleSignIn = () => {
    if (!validateNetId(netId)) {
      setError("Please enter a valid Georgetown NetID.");

      return;
    }
    setError(null);

    const fullEmail = `${netId.toLowerCase()}@georgetown.edu`;

    // ✅ After sign in, go to /home
    router.replace("/home");

    // (optional) show success message
    // Alert.alert("Success", `Welcome to RedSquare, ${fullEmail}!`);
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
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.tfInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity onPress={forgotPassword}>
           <GradientText> Forgot Password?</GradientText>
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity onPress={handleSignIn} style={styles.button}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        Only Georgetown University students, faculty, and staff with valid NetIDs can access RedSquare.
      </Text>
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
    paddingLeft: 58,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 100,
  },
    error: {
    fontFamily: 'Jost_500Medium',
    color: '#D74A4A',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 12,
  },
  title: {
    color: "red",
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
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
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  forgotPassword: {
    color: "#D74A4A",
    textAlign: "left",
    marginBottom: 10,
    fontWeight: "500",
  },  
});
