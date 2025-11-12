import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// This file now just redirects to bulletin
// Since the home button should show the bulletin with saved posts
export default function HomePage(){
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to bulletin immediately
    router.replace("/bulletin");
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#D74A4A" />
    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffcf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});