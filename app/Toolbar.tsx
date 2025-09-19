import { useRouter } from "expo-router";
import { Button, StyleSheet, View } from "react-native";


export default function ToolBar(){
    const router = useRouter(); 
    return (
        <View style={styles.container}>
            <Button color='red' title="Home" onPress={() => router.push("/")} />
            <Button color='red' title="Explore" onPress={() => router.push("/explore")} />
            <Button color='red' title="Create" onPress={() => router.push("/createPost")} />


        </View>
      )
} 
const styles = StyleSheet.create({
    container: {
      color: 'black', 
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      bottom: 0,

      backgroundColor: '#fffcf4',
    },
      text: {
        color: 'red',
        fontSize: 67,
        fontWeight: 'bold',
        textAlign: 'center',
      }
      ,  button: {

        flexDirection: 'row',
        alignItems: 'flex-end',
      }
  })