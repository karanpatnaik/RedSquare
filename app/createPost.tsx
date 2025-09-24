import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import ToolBar from "./Toolbar";

export default function CreatePost(){
    const router = useRouter(); 
    return (
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <Image
              source={require('../assets/images/rslogo.png')}
              style={styles.logo}
            />
            <Text style={styles.text}>Create</Text>
          </View>
          <View style={styles.toolbarContainer}>
            <ToolBar />
          </View>
        </View>
      )
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffcf4',
    paddingTop: 60,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  text: {
    color: 'red',
    fontSize: 56,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  toolbarContainer: {
    paddingBottom: 40,
  }
})