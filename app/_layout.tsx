import { Stack } from "expo-router";

export default function RootLayout() {

  return (
    <Stack screenOptions={{ headerShown: false }}>
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
    </Stack>
  );
}