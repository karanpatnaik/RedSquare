import { useRouter } from "expo-router"; //allows us to navigate between files
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

//again, export default means we can use this component in other files.
export default function ToolBar() {
  const router = useRouter(); //this gives us access to push, replace, and back. for switching pages

  //this returns a component with 3 "touchable" buttons that navigate to different files when pressed
  //a view is like a div
  //styles calls the styles object defined below
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/home")}>
        <Text style={styles.buttonText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/explore")}>
        <Text style={styles.buttonText}>Explore</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/createPost")}>
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 80,
    backgroundColor: '#D74A4A',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});
