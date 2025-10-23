import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { supabase } from "../lib/supabase";
import GradientText from "./GradientText";
import ToolBar from "./Toolbar";

type ClubOption = { id: string; name: string };

export default function CreatePost(){
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);

  // form fields
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(''); // expected YYYY-MM-DD (date column will accept this)
  const [eventLocation, setEventLocation] = useState<string>('');

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
        setImageUri(result.assets[0].uri);
        setIsCreating(true);
      }
    } catch {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  // Fetch authorized clubs for the current user
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      // Try to fetch authorized clubs via FK join
      const { data, error } = await supabase
        .from('club_members')
        .select('club_id, clubs(name)')
        .eq('user_id', user.id)
        .eq('role', 'authorized');

      if (error) {
        console.warn('Fetch authorized clubs failed:', error.message);
        return;
      }

      const options: ClubOption[] =
        (data ?? [])
          .map((row: any) => ({
            id: row.club_id,
            name: row.clubs?.name ?? 'Unnamed Club'
          }));

      // Remove duplicates just in case
      const dedup = new Map<string, ClubOption>();
      for (const c of options) dedup.set(c.id, c);
      setAuthorizedClubs(Array.from(dedup.values()));
    })();
  }, []);

  const canSubmit = useMemo(() => {
    return !!eventTitle.trim() && !!eventDate.trim() && !!eventLocation.trim();
  }, [eventTitle, eventDate, eventLocation]);

  // Upload image (if any) to storage and return public URL (or null)
  const uploadImageIfAny = async (userId: string): Promise<string | null> => {
    if (!imageUri) return null;
    try {
      const res = await fetch(imageUri);
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const fileExt = 'jpg'; // we can refine by detecting content-type
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase
        .storage
        .from('post-images')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabase
        .storage
        .from('post-images')
        .getPublicUrl(filePath);

      return publicData?.publicUrl ?? null;
    } catch (err: any) {
      console.warn('Image upload failed:', err?.message || err);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Missing info', 'Please fill title, date, and location.');
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in again.');
      return;
    }

    try {
      // 1) upload image (optional)
      const publicUrl = await uploadImageIfAny(user.id);

      // 2) insert post (RLS enforces club authorization & visibility)
      const insertPayload: any = {
        user_id: user.id,
        title: eventTitle.trim(),
        description: null,
        image_url: publicUrl,
        location: eventLocation.trim(),
        event_date: eventDate.trim(),
        is_active: true,
      };

      if (selectedClubId) {
        insertPayload.club_id = selectedClubId;
        insertPayload.visibility = visibility; // 'public' | 'private'
      } else {
        // Non-club post — we keep default visibility 'public' (db default)
        insertPayload.club_id = null;
      }

      const { error: insertErr } = await supabase
        .from('posts')
        .insert(insertPayload);

      if (insertErr) throw insertErr;

      // 3) navigate to Explore so user sees the new post
      router.replace('/explore');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to create post.');
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
              <TouchableOpacity onPress={() => { pickImage(); setIsCreating(true); }} style={styles.centerButton}>
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
              onChangeText={(text) => { setEventTitle(text); setIsCreating(true); }}
              placeholder="Your Event's title"
              placeholderTextColor="#6A5151"
            />

            <GradientText fontSize={14}>When</GradientText>
            <TextInput
              style={styles.inputField}
              value={eventDate}
              onChangeText={(text) => { setEventDate(text); setIsCreating(true); }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#6A5151"
            />

            <GradientText fontSize={14}>Where</GradientText>
            <TextInput
              style={styles.inputField}
              value={eventLocation}
              onChangeText={(text) => { setEventLocation(text); setIsCreating(true); }}
              placeholder="Add a location"
              placeholderTextColor="#6A5151"
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

            {/* Visibility only when a club is selected */}
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

        {/* Map image stays as-is */}
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
            <Image
              source={require('../assets/images/backarrow.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit}>
            <Image style={styles.sendButton} source={require('../assets/images/sendbutton.png')} />
          </TouchableOpacity>
        </View>
      )}

      {/* Simple modal dropdown */}
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
  screen: { flex: 1, backgroundColor: '#fffcf4', paddingTop: 32 },
  headerSection: { alignItems: 'center', marginBottom: 16 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
    width: '80%', maxWidth: 700, marginHorizontal: 'auto',
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
  cameraBorder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', resizeMode: 'contain' },
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

  title: { fontSize: 48, fontWeight: 'bold', color: '#8a2525', fontFamily: 'Jost_600SemiBold' },
  inputField: {
    fontSize: 14, color: '#222', fontFamily: 'Jost_400Regular',
    paddingVertical: 4, paddingHorizontal: 8, marginBottom: 12, minWidth: 200,
  },

  // dropdown
  dropdown: {
    width: 240, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#f0d6d6', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  dropdownText: { color: '#333', fontFamily: 'Jost_400Regular' },
  dropdownCaret: { color: '#9c2c2c', fontSize: 16 },

  // visibility toggle
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#f0d6d6', borderRadius: 8, backgroundColor: '#fff' },
  toggleBtnActive: { borderColor: '#9c2c2c' },
  toggleText: { color: '#333', fontFamily: 'Jost_400Regular' },
  toggleTextActive: { color: '#9c2c2c', fontFamily: 'Jost_600SemiBold' },

  // modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '86%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f0d6d6' },
  modalTitle: { fontFamily: 'Jost_600SemiBold', fontSize: 16, marginBottom: 8, color: '#333' },
  modalItem: { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f6e2e2' },
  modalItemText: { color: '#333', fontFamily: 'Jost_400Regular' },
  modalClose: { paddingVertical: 10, alignItems: 'center' },
  modalCloseText: { color: '#9c2c2c', fontFamily: 'Jost_600SemiBold' },
});
