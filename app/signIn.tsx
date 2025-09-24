import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignInPage() {
  const [netId, setNetId] = useState('');
  const router = useRouter();

  const validateNetId = (netId: string) => {
    // Check if it's a valid NetID format (alphanumeric, reasonable length)
    const netIdRegex = /^[a-zA-Z0-9]{2,20}$/;
    return netId.trim().length > 0 && netIdRegex.test(netId.trim());
  };

  const handleSignIn = () => {
    if (!validateNetId(netId)) {
      Alert.alert('Invalid NetID', 'Please enter a valid Georgetown NetID (letters and numbers only)');
      return;
    }

    // In a real implementation, you would authenticate with Georgetown's system
    const fullEmail = `${netId.toLowerCase()}@georgetown.edu`;
    Alert.alert('Success', `Welcome to RedSquare, ${fullEmail}!`, [
      { text: 'OK', onPress: () => router.replace('/') }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RedSquare</Text>
      <Text style={styles.subtitle}>Georgetown University</Text>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Georgetown NetID</Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="your-netid"
            value={netId}
            onChangeText={setNetId}
            style={styles.netIdInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.domainText}>@georgetown.edu</Text>
        </View>

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
    backgroundColor: '#fffcf4',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: 'red',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  netIdInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  domainText: {
    color: '#666',
    fontSize: 16,
    paddingRight: 12,
  },
  button: {
    backgroundColor: 'red',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});