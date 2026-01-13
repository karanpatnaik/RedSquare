
//importing fonts
import { Jost_400Regular, Jost_500Medium, Jost_600SemiBold, Jost_700Bold, useFonts } from "@expo-google-fonts/jost";

//importing stack from expo-router so that we do not have to manually create a stack navigator
import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

//export default means we won't have to import this component into other files
export default function RootLayout()
{
  //the function useFonts returns an size-2 array, where the first element is a boolean indicating
  //whether the fonts have finished loading or not, and the second element is an error.
  //const [fonstsLoaded] assigns the first element returned by useFonts to the variable fontsLoaded
    const [fontsLoaded] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold,
  });

  // Handle deep links for password reset
  useEffect(() => {
    // Handle the initial URL if the app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while the app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    // Supabase will automatically handle the session from the magic link
    // The URL contains fragments like #access_token=...&refresh_token=...
    const { data, error } = await supabase.auth.getSession();

    if (data?.session) {
      // Session is already set by Supabase, no additional action needed
      console.log('Session restored from deep link');
    }
  };

  if (!fontsLoaded)
  {
    return null; // Render nothing while fonts are loading
  }

  //we return the new state of the stack navigator, aka the structure of the files
  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }} />
  )
};


