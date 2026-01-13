import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../styles/tokens";

// This file now just redirects to bulletin
// Since the home button should show the bulletin with saved posts
export default function HomePage(){
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to bulletin immediately
    router.replace("/bulletin");
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
