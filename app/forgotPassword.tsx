// app/forgot-password.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import GradientText from "./GradientText";

export default function ForgotPasswordPage() {
  const [netId, setNetId] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const validateNetId = (netId: string) => {
    const netIdRegex = /^[a-zA-Z0-9]{2,20}$/;
    return netId.trim().length > 0 && netIdRegex.test(netId.trim());
  };

  const handleSendResetLink = () => {
    if (!validateNetId(netId)) {
      return;
    }
    
    // TODO: Call your password reset function here
    // For now, just show success state
    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>✓</Text>
          <GradientText fontFamily="Jost_500Medium" fontSize={32}>
            Check your email
          </GradientText>
          <Text style={styles.successText}>
            We sent a password reset link to
          </Text>
          <Text style={styles.emailText}>
            {netId.toLowerCase()}@georgetown.edu
          </Text>
          <Text style={styles.instructionText}>
            Click the link in the email to reset your password. The link will expire in 24 hours.
          </Text>
          
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.button}
          >
            <Text style={styles.buttonText}>Back to Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setEmailSent(false)}
            style={styles.resendContainer}
          >
            <Text style={styles.resendText}>
              Didn't receive the email?{" "}
              <GradientText fontSize={14}>Resend</GradientText>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <GradientText fontFamily="Jost_500Medium" fontSize={36}>
          Reset Password
        </GradientText>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.description}>
          Enter your Georgetown NetID and we'll send you a link to reset your password.
        </Text>

        <Text style={styles.label}>Georgetown NetID</Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="NetID"
            value={netId}
            onChangeText={setNetId}
            style={styles.tfInput}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          <Text style={styles.domainText}>@georgetown.edu</Text>
        </View>

        <TouchableOpacity 
          onPress={handleSendResetLink} 
          style={[
            styles.button,
            !validateNetId(netId) && styles.buttonDisabled
          ]}
          disabled={!validateNetId(netId)}
        >
          <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        Remember your password?{" "}
        <TouchableOpacity onPress={() => router.back()}>
          <GradientText fontSize={12}>Sign In</GradientText>
        </TouchableOpacity>
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
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
  },
  backText: {
    fontSize: 16,
    color: "#D74A4A",
    fontFamily: "Jost_500Medium",
  },
  headerRow: {
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    marginBottom: 20,
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
  buttonDisabled: {
    backgroundColor: "#ddd",
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
    fontFamily: "Jost_400Regular",
  },
  
  // Success state styles
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
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
  emailText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
    marginBottom: 20,
    fontFamily: "Jost_500Medium",
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
  resendContainer: {
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontFamily: "Jost_400Regular",
  },
});