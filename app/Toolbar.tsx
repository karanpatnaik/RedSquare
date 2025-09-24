import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


export default function ToolBar(){
    const router = useRouter(); 
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={() => router.push("/")}>
                <Text style={styles.buttonText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push("/explore")}>
                <Text style={styles.buttonText}>Explore</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push("/createPost")}>
                <Text style={styles.buttonText}>Create</Text>
            </TouchableOpacity>
        </View>
      )
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