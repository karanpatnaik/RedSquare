import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import ToolBar from "./Toolbar";

export default function CreatePost(){
    const router = useRouter(); 
    return (
        <View style={styles.container}>
          <View className = "page"> {
             <Text style={styles.text}> Create </Text>
          }
        </View>
          <View >
            <ToolBar />
          </View>
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
  },
  button: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  }
  }
) 