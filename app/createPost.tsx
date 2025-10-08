import * as ImagePicker from 'expo-image-picker'; //ImagePicker allows us to access the camera roll
import * as Linking from 'expo-linking'; //this well let us open phone settings if photo access is denied
import { useRouter } from "expo-router"; //allows use to switch between files/pages
import { useState } from "react"; //useState allows us to effectively create global variables. react 
//will re-render the page when these variables change, and it will remember the changes
import { Alert, Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import ToolBar from "./Toolbar";
// import GradientText from "../components/GradientText"; // Adjust path if needed
// If the file exists elsewhere, update the path below:
import GradientText from "./GradientText"; // Adjust path if your GradientText is in components


export default function CreatePost(){
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('');
  const [eventLocation, setEventLocation] = useState<string>('');

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

    return (
  <View style={styles.screen}>
    <View style={styles.headerSection}>
      <View style={styles.headerRow}>
        <Image source={require('../assets/images/rslogo.png')} style={styles.rslogo} />
        <GradientText fontFamily="Jost_500Medium" fontSize={44}>
          Create 
        </GradientText>
        <Image source={require('../assets/images/corplogo.png')} style={styles.corplogo} />

      </View>
      <View style={styles.redLine} />
    </View>

    <View style={styles.content}>
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
          <TextInput
            style={styles.inputField}
            value={eventTitle}
            onChangeText={(text) => {
              setEventTitle(text);
              setIsCreating(true);
            }}
            placeholder="Your Event's title"
            placeholderTextColor="gray"
          />
          <GradientText fontSize={14}>When</GradientText>
          <TextInput
            style={styles.inputField}
            value={eventDate}
            onChangeText={(text) => {
              setEventDate(text);
              setIsCreating(true);
            }}
            placeholder="Set the date.."
            placeholderTextColor="gray"
          />
          <GradientText fontSize={14}>Where</GradientText>
          <TextInput
            style={styles.inputField}
            value={eventLocation}
            onChangeText={(text) => {
              setEventLocation(text);
              setIsCreating(true);
            }}
            placeholder="Add a location"
            placeholderTextColor="gray"
          />
        </View>
      </View>

      <View style={styles.mapContainer}>
        <Image
          source={require('../assets/images/gumap.png')}
          style={styles.mapImage}
          resizeMode="contain"
        />
      </View>
    </View>

    <View style={styles.toolbarWrapper}>
      {isCreating ? null : <ToolBar />}
    </View>
  </View>
)
} 

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fffcf4',
    paddingTop: 32,
  },
headerSection: {
  alignItems: 'center',
  marginBottom: 16,
},

headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-evenly',
  width: '80%',
  maxWidth: 700,
  marginHorizontal: 'auto',
},
rslogo: {
  width: 90,
  height: 90,
  marginRight: 13,
  resizeMode: 'contain',
},

corplogo: {
  width: 75,
  height: 56,
  resizeMode: 'contain',
  marginLeft: -38,
},
  redLine: {
    width: '100%',
    maxWidth: 700,
    height: 1,
    backgroundColor: '#D74A4A',
    marginTop: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingBottom: 100,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8a2525',
    fontFamily: 'Jost_600SemiBold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 700,
    gap: 16,
    marginBottom: 32,
    paddingLeft: 30,
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
  mapContainer: {
    width: '100%',
    maxWidth: 600,
    height: 300, // adjust size as needed
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
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
  inputField: {
    fontSize: 14,
    color: '#222',
    fontFamily: 'Jost_400Regular',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 12,
    minWidth: 200,
  },
})