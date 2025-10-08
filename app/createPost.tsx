import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ToolBar from "./Toolbar";
// import GradientText from "../components/GradientText"; // Adjust path if needed
// If the file exists elsewhere, update the path below:
import GradientText from "./GradientText"; // Adjust path if your GradientText is in components


export default function CreatePost(){
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>(['','','','','','']);

  const ensureMediaPermission = async () => { // needed for ios to allow image picker
    const { status, granted, canAskAgain } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (granted) return true;
    if (!canAskAgain) {
      Alert.alert(
        'Permission required',
        'Enable Photo access in Settings to pick an image.',
        [
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
    return false;
  };

  const pickImage = async () => {
    const ok = await ensureMediaPermission();
    if (!ok) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsMultipleSelection: false,
        selectionLimit: 1,
      });
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const updateLine = (i: number, v: string) =>
    setLines(prev => prev.map((l, idx) => idx === i ? v : l));

    return (
  <View style={styles.screen}>
    <View style={styles.content}>
      <View style={styles.headerRow}>
        <Image source={require('../assets/images/rslogo.png')} style={styles.logo} />
            <GradientText fontFamily="Jost_500Medium" fontSize={44}>
                Create 
            </GradientText>
      </View>
      <View style={styles.redLine} />

      <View style={styles.actionRow}>
        <View style={styles.cameraWrapper}>
          {!imageUri && (
            <Image
              source={require('../assets/images/CameraBorder.png')}
              style={styles.cameraBorder}
            />
          )}
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.capturedImage} resizeMode="contain" />
          ) : (
            <TouchableOpacity onPress={pickImage} style={styles.centerButton}>
              <Image
                source={require('../assets/images/uploadcamera.png')}
                style={styles.cameraIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.gradientLines}>
          <GradientText fontSize={14}>What</GradientText>
          <Text style={{ color: 'gray', fontFamily: 'Jost_400Regular' }}>  Your Event’s title</Text>
          <GradientText fontSize={14}>When</GradientText>
          <Text style={{ color: 'gray', fontFamily: 'Jost_400Regular' }}>  Set the date..</Text>
          <GradientText fontSize={14}>Where</GradientText>
          <Text style={{ color: 'gray', fontFamily: 'Jost_400Regular' }}>  Add a location</Text>
        </View>
      </View>
    </View>

    <View style={styles.toolbarWrapper}>
      <ToolBar />
    </View>
  </View>
)
} 

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fffcf4',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',  // keeps the whole row vertically centered
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 110,
    height: 110,
    marginRight: 16,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8a2525',
    fontFamily: 'Jost_600SemiBold',
  },
    redLine: {
    width: '100%',
    height: 0.5,
    backgroundColor: '#D74A4A', // or use your gradient red
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 700,
    gap: 16, // if gap not supported, add marginRight on cameraWrapper
  },
  gradientLines: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
  },
  cameraWrapper: {
    width: 260,
    height: 260,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  centerButton: { justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { width: 72, height: 72, resizeMode: 'contain' },
  toolbarWrapper: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#fffcf4',
    alignItems: 'center',
  },
  lineInput: {
    width: 320,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#222',
    marginBottom: 6,
    fontFamily: 'Jost_400Regular',
  },
})