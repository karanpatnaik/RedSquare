import { Jost_400Regular, Jost_500Medium, Jost_600SemiBold, Jost_700Bold, useFonts } from "@expo-google-fonts/jost";
import { Stack } from "expo-router";
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold,
  });
  return (
    <Stack screenOptions={{ headerShown: false, animation: "none"}}>
      {/* Sign In screen */}
      <Stack.Screen
        name="signIn"
        options={{ title: "Sign In" }}
      />
      
      {/* Home screen */}
      <Stack.Screen
        name="homePage"
        options={{ title: "Red Square", headerShown: true }}
      />
      

      {/* Second screen */}
      <Stack.Screen
        name="second"
        options={{ title: "Second Page", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="CreatePost"
        options={{ title: "Create", headerBackTitle: "Back" }}
      />
    </Stack>
  );
}