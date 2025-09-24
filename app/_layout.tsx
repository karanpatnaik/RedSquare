import { Stack } from "expo-router";

export default function RootLayout() {

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