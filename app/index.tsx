import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import ToolBar from "./Toolbar";


export default function HomePage(){
  const router = useRouter(); 
  return (
        <View style={styles.container}>
          <View style={styles.titleContainer}> 
             <Text style={styles.text}>RedSquare</Text>
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