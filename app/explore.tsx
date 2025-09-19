import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import ToolBar from "./Toolbar";

export default function Explore(){
    const router = useRouter(); 
    return (
        <View style={styles.container}>
          <View> 
             <Text style={styles.text}> Explore  </Text>
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
    backgroundColor: '#fffcf4',
    justifyContent: 'space-between',
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