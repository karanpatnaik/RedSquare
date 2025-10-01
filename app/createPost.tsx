import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ToolBar from "./Toolbar";


export default function CreatePost(){
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

    return (
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <Image
              source={require('../assets/images/rslogo.png')}
              style={styles.logo}
            />
            <Text style={styles.text}>Create</Text>
            <TouchableOpacity onPress={pickImage} style={{ marginTop: 20 }}>
              <Text style={{ color: 'blue', fontSize: 18 }}>
                {imageUri ? 'Change Image' : 'Pick an Image'}
              </Text>
            </TouchableOpacity>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 200, height: 200, marginTop: 20, borderRadius: 10 }}
              />
            )}
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