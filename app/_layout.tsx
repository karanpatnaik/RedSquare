import { Jost_400Regular, Jost_500Medium, Jost_600SemiBold, Jost_700Bold, useFonts } from "@expo-google-fonts/jost";
import { Stack } from "expo-router";
export default function RootLayout() {
    const [fontsLoaded] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }
  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }} />
  )};


