
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
    // Extract the hash fragment from the URL which contains the session tokens
    // Format: exp://...#access_token=...&refresh_token=...&type=recovery
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) return;

    const hash = url.substring(hashIndex + 1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    // Only handle recovery type (password reset)
    if (type === 'recovery' && accessToken && refreshToken) {
      try {
        // Set the session with the tokens from the URL
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Error setting session from deep link:', error);
        } else {
          console.log('Session successfully set from password reset link');
        }
      } catch (err) {
        console.error('Exception handling deep link:', err);
      }
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


