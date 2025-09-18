import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";


export default function ToolBar(){
    const router = useRouter(); 
    return (
        <View style={styles.container}>
            <Text> hi </Text>
            <Button title="Explore" onPress={() => router.push("/explore")} />
            <Button title="Home" onPress={() => router.push("/")} />
            <Button title="Create" onPress={() => router.push("/createPost")} />


        </View>
      )
} 
const styles = StyleSheet.create({
    container: {
      color: 'black', 
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