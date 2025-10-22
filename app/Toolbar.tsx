import { useRouter } from "expo-router"; //allows us to navigate between files
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

//again, export default means we can use this component in other files.
export default function ToolBar() {
  const router = useRouter(); //this gives us access to push, replace, and back. for switching pages

  //this returns a component with 3 "touchable" buttons that navigate to different files when pressed
  //a view is like a div
  //styles calls the styles object defined below
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/home")}>
        <Image source={require('../assets/images/houseicon.png')} style={styles.buttonIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/bulletin")}>
        <Image source={require('../assets/images/MagnifyingGlass.png')} style={styles.buttonIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/createPost")}>
        <Image source={require('../assets/images/plussign.png')} style={styles.buttonIcon} />
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
    borderTopColor: '#D74A4A',
    borderTopWidth: 1,
    marginTop: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});
