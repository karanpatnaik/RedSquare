import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import ToolBar from "./Toolbar";


export default function HomePage(){
  const router = useRouter(); 
  return (
    <View>
      <View style={styles.container}>
        <Text style={styles.text}> Red Square </Text>
      </View>
      <ToolBar />
    </View>
  )

} 

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  text: {
    color: 'red',
    fontSize: 67,
    fontWeight: 'bold',
    textAlign: 'center',
  }
  }
) 