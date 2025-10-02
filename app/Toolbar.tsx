import { usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


export default function ToolBar(){
  const router = useRouter();
  const pathname = usePathname();

  const go = (path: string) => {
    if (pathname === path) return; // prevent re-pushing same route
    router.push(path as any);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => go("/")}>
        <Text style={styles.buttonText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => go("/explore")}>
        <Text style={styles.buttonText}>Explore</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => go("/createPost")}>
        <Text style={styles.buttonText}>Create</Text>
      </TouchableOpacity>
    </View>
  );
} 
const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#fffcf4',
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    button: {
      backgroundColor: 'red',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
      minWidth: 80,
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    }
  })