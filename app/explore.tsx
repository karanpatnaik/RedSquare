import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function SecondPage(){
    const router = useRouter(); 
    return (
        <View style={styles.container}>
          <Text style={styles.text}> Explore </Text>
          <Button title = "First Page" onPress={()=>router.push("/")}></Button>
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