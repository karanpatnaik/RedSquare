// npx expo install @react-native-community/datetimepicker
// # then rebuild with EAS or prebuild+native build:
// # npx expo prebuild
// # eas build --platform ios|android   (or run a dev client)
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import GradientText from "./GradientText";
import ToolBar from "./Toolbar";

type ClubOption = { id: string; name: string };

export default function CreatePost(){
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);

  // form fields
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(''); 
  const [eventLocation, setEventLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false); // added

  // club / visibility
  const [authorizedClubs, setAuthorizedClubs] = useState<ClubOption[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  // dropdown UI
  const [clubPickerOpen, setClubPickerOpen] = useState(false);

  const ensureMediaPermission = async () => {
    const { granted, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (granted) return true;
    if (!canAskAgain) {
      Alert.alert(
        'Permission required',
        'Enable Photo access in Settings to pick an image.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
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
        console.log("✅ Picked image:", result.assets[0].uri);
        setImageUri(result.assets[0].uri);
        setIsCreating(true);
      }
    } catch (err) {
      console.error("❌ Image picker error:", err);
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

    return (
  <View style={styles.screen}>
    <View style={styles.headerSection}>
      <Image source={require('../assets/images/rslogo.png')} style={styles.leftLogo} />

      <View style={styles.titleContainer}>
        <GradientText fontFamily="Jost_500Medium" fontSize={44} width={260}>
          Create
        </GradientText>
      </View>

      <Image source={require('../assets/images/corplogo.png')} style={styles.rightLogo} />
    </View>
    <View style={styles.redLine} />

      <ScrollView contentContainerStyle={styles.content}>
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
              placeholder="Your Event's title"
              value={eventTitle}
              onChangeText={(text) => { setEventTitle(text); setIsCreating(true); }}
            />

            <GradientText fontSize={14}>When</GradientText>
            {/* <DateTimePicker
              style={styles.inputField}
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || new Date();
                const formattedDate = currentDate.toISOString().split('T')[0];
                setEventDate(formattedDate);
                setIsCreating(true);
              }}
            /> */}
            <TextInput
              style={styles.inputField}
              placeholder="YYYY-MM-DD"
              value={eventDate}
              onChangeText={(text) => { setEventDate(text); setIsCreating(true); }}
            />

            <GradientText fontSize={14}>Where</GradientText>
            <TextInput
              style={styles.inputField}
              placeholder="Add a location"
              value={eventLocation}
              onChangeText={(text) => { setEventLocation(text); setIsCreating(true); }}
            />

            <GradientText fontSize={14}>Description (optional)</GradientText>
            <TextInput
              style={[styles.inputField, { height: 60 }]}
              placeholder="A short description..."
              value={description}
              multiline
              onChangeText={(text) => { setDescription(text); setIsCreating(true); }}
            />

            {/* Club picker */}
            <GradientText fontSize={14}>Post as Club (optional)</GradientText>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setClubPickerOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>
                {selectedClubId
                  ? authorizedClubs.find(c => c.id === selectedClubId)?.name ?? 'Select club'
                  : (authorizedClubs.length ? 'Select club' : 'No authorized clubs')}
              </Text>
              <Text style={styles.dropdownCaret}>▾</Text>
            </TouchableOpacity>

            {selectedClubId && (
              <View style={{ marginTop: 8 }}>
                <GradientText fontSize={14}>Visibility</GradientText>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, visibility === 'public' && styles.toggleBtnActive]}
                    onPress={() => setVisibility('public')}
                  >
                    <Text style={[styles.toggleText, visibility === 'public' && styles.toggleTextActive]}>Public</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, visibility === 'private' && styles.toggleBtnActive]}
                    onPress={() => setVisibility('private')}
                  >
                    <Text style={[styles.toggleText, visibility === 'private' && styles.toggleTextActive]}>Private</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.mapContainer}>
          <Image
            source={require('../assets/images/gumap.png')}
            style={styles.mapImage}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      {!isCreating ? (
        <ToolBar />
      ) : (
        <View style={styles.createPostToolbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Image source={require('../assets/images/backarrow.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit}>
            <Image style={styles.sendButton} source={require('../assets/images/sendbutton.png')} />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal */}
      <Modal visible={clubPickerOpen} transparent animationType="fade" onRequestClose={() => setClubPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select a club</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {authorizedClubs.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedClubId(club.id);
                    setClubPickerOpen(false);
                    setIsCreating(true);
                  }}
                >
                  <Text style={styles.modalItemText}>{club.name}</Text>
                </TouchableOpacity>
              ))}
              {authorizedClubs.length === 0 && (
                <Text style={{ textAlign: 'center', color: '#666', marginVertical: 8 }}>
                  You are not authorized to post for any clubs.
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setClubPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fffcf4',
    paddingTop: 32,
  },
  headerSection: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // left / center / right fill width
    paddingHorizontal: 20,
    paddingBottom: 0,
    top: 20,
  },
  titleContainer: {
    flex: 1,
    left: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftLogo: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  rightLogo: {
    left: 40,
    width: 160,
    height: 64,
    resizeMode: 'contain',
  },
  redLine: {
    width: '100%',
    maxWidth: 700,
    height: 1,
    alignSelf: 'center',
    backgroundColor: '#D74A4A',
    marginTop: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingBottom: 100,
  },
  backButton: {
  },
  backIcon: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
  },
  sendButton: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
  },
  createPostToolbar: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#git fffcf4',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopColor: '#D74A4A',
    borderTopWidth: 1,
    marginTop: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8a2525',
    fontFamily: 'Jost_600SemiBold',
  },
  rslogo: { width: 90, height: 90, marginRight: 13, resizeMode: 'contain' },
  corplogo: { width: 75, height: 56, resizeMode: 'contain', marginLeft: -38 },
  redLine: { width: '100%', maxWidth: 700, height: 1, backgroundColor: '#D74A4A', marginTop: 8 },

  content: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 40, paddingBottom: 100 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%', maxWidth: 700, gap: 16, alignContent: 'space-between',
    marginBottom: 32, paddingLeft: 30,
  },
  gradientLines: { justifyContent: 'center', alignItems: 'flex-start', gap: 12 },

  cameraWrapper: { width: 260, height: 260, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  cameraBorder: { position: 'absolute', width: '100%', height: '100%', resizeMode: 'contain' },
  capturedImage: { width: '100%', height: '100%' },
  centerButton: { justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { width: 72, height: 72, resizeMode: 'contain' },

  mapContainer: { width: '100%', maxWidth: 600, height: 300, alignItems: 'center', justifyContent: 'center' },
  mapImage: { width: '100%', height: '100%' },

  createPostToolbar: {
    width: '100%', alignSelf: 'center', flexDirection: 'row',
    backgroundColor: '#fffcf4', paddingVertical: 20, paddingHorizontal: 24,
    borderTopColor: '#D74A4A', borderTopWidth: 1, marginTop: 8, justifyContent: 'space-between', alignItems: 'center',
  },
  backButton: {},
  backIcon: { width: 65, height: 65, resizeMode: 'contain' },
  sendButton: { width: 65, height: 65, resizeMode: 'contain' },

  inputField: {
    fontSize: 14, color: '#222', fontFamily: 'Jost_400Regular',
    paddingVertical: 4, paddingHorizontal: 8, marginBottom: 12, minWidth: 200,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: '#f0d6d6', borderRadius: 8,

  },

  dropdown: {
    width: 240, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'transparent',
    borderWidth: 1, borderColor: '#f0d6d6', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  dropdownText: { color: '#333', fontFamily: 'Jost_400Regular', backgroundColor: 'transparent' },
  dropdownCaret: { color: '#9c2c2c', fontSize: 16 },

  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#f0d6d6', borderRadius: 8, backgroundColor: '#fff' },
  toggleBtnActive: { borderColor: '#9c2c2c' },
  toggleText: { color: '#333', fontFamily: 'Jost_400Regular' },
  toggleTextActive: { color: '#9c2c2c', fontFamily: 'Jost_600SemiBold' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '86%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f0d6d6' },
  modalTitle: { fontFamily: 'Jost_600SemiBold', fontSize: 16, marginBottom: 8, color: '#333' },
  modalItem: { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f6e2e2' },
  modalItemText: { color: '#333', fontFamily: 'Jost_400Regular' },
  modalClose: { paddingVertical: 10, alignItems: 'center' },
  modalCloseText: { color: '#9c2c2c', fontFamily: 'Jost_600SemiBold' },
});