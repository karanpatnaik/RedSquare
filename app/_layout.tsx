
//importing fonts 
import { Jost_400Regular, Jost_500Medium, Jost_600SemiBold, Jost_700Bold, useFonts } from "@expo-google-fonts/jost";

//importing stack from expo-router so that we do not have to manually create a stack navigator
import { Stack } from "expo-router";

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

  if (!fontsLoaded) 
  {
    return null; // Render nothing while fonts are loading
  }

  //we return the new state of the stack navigator, aka the structure of the files
  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }} />
  )
};


