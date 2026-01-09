import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import GradientText from "../../components/GradientText";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import { supabase } from "../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";

type ClubOption = { id: string; name: string };

type ImageItem = {
  id: string;
  uri: string;
};

type Step = "details" | "preview";

const MAX_IMAGES = 4;

const CAMPUS_LOCATIONS = [
  "Leavey Center",
  "HFSC",
  "Red Square",
  "Healey Hall",
  "Copley Hall",
  "Georgetown Bookstore",
  "Sellinger Lounge",
  "Regents Hall",
  "North Kehoe",
  "ICC Auditorium",
  "Dahlgren Chapel",
  "Hariri Building",
  "Gaston Hall",
  "Royden B. Davis Performing Arts",
  "Reynolds Hall",
  "Arrupe Hall",
  "Southwest Quad",
  "Car Barn",
  "McDonough Arena",
];

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

const formatWebDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatWebTime = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const parseWebDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  return candidate;
};

const parseWebTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const candidate = new Date();
  candidate.setHours(hours, minutes, 0, 0);
  return candidate;
};

export default function CreatePost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const isAndroid = Platform.OS === "android";

  const [step, setStep] = useState<Step>("details");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [eventTime, setEventTime] = useState<Date | null>(null);
  const [eventDateInput, setEventDateInput] = useState("");
  const [eventTimeInput, setEventTimeInput] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [description, setDescription] = useState("");

  const [authorizedClubs, setAuthorizedClubs] = useState<ClubOption[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const [clubPickerOpen, setClubPickerOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempPickerDate, setTempPickerDate] = useState(new Date());

  const [touched, setTouched] = useState({
    title: false,
    date: false,
    time: false,
    location: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedClubName = selectedClubId
    ? authorizedClubs.find((club) => club.id === selectedClubId)?.name
    : null;

  const coverImage = images[coverIndex] ?? images[0] ?? null;

  useEffect(() => {
    if (!selectedClubId) {
      setVisibility("public");
    }
  }, [selectedClubId]);

  useEffect(() => {
    if (!isWeb) return;
    if (eventDate) setEventDateInput(formatWebDate(eventDate));
  }, [eventDate, isWeb]);

  useEffect(() => {
    if (!isWeb) return;
    if (eventTime) setEventTimeInput(formatWebTime(eventTime));
  }, [eventTime, isWeb]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("club_members")
        .select("club_id, clubs(name)")
        .eq("user_id", user.id)
        .eq("role", "authorized");

      if (error) {
        console.warn("Fetch authorized clubs failed:", error.message);
        return;
      }

      const options: ClubOption[] =
        (data ?? []).map((row: any) => ({
          id: row.club_id,
          name: row.clubs?.name ?? "Unnamed Club",
        }));

      setAuthorizedClubs(Array.from(new Map(options.map((club) => [club.id, club])).values()));
    })();
  }, []);

  const locationSuggestions = useMemo(() => {
    const query = eventLocation.trim().toLowerCase();
    if (!query) return [];
    return CAMPUS_LOCATIONS.filter((loc) => {
      const lowered = loc.toLowerCase();
      return lowered.includes(query) && lowered !== query;
    }).slice(0, 5);
  }, [eventLocation]);

  const dateLabel = eventDate ? formatDate(eventDate) : "";
  const timeLabel = eventTime ? formatTime(eventTime) : "";
  const combinedDateTime = eventDate && eventTime
    ? new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        eventTime.getHours(),
        eventTime.getMinutes(),
        0,
        0
      )
    : null;
  const dateTimeLabel = combinedDateTime
    ? `${formatDate(combinedDateTime)} • ${formatTime(combinedDateTime)}`
    : "";

  const titleError = touched.title && !eventTitle.trim() ? "Event title is required." : "";
  const dateError = touched.date && !eventDate ? "Select a date." : "";
  const timeError = touched.time && !eventTime ? "Select a time." : "";
  const locationError = touched.location && !eventLocation.trim() ? "Location is required." : "";

  const canSubmit = !!(
    eventTitle.trim() &&
    eventDate &&
    eventTime &&
    eventLocation.trim()
  );

  const ensureMediaPermission = async () => {
    const { granted, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (granted) return true;
    if (!canAskAgain) {
      Alert.alert("Permission required", "Enable Photo access in Settings to pick an image.", [
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]);
    }
    return false;
  };

  const pickImages = async () => {
    const ok = await ensureMediaPermission();
    if (!ok) return;
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Limit reached", `You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    try {
      const remaining = MAX_IMAGES - images.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });
      if (!result.canceled) {
        const next = result.assets.map((asset, index) => ({
          id: `${Date.now()}-${index}`,
          uri: asset.uri,
        }));
        setImages((prev) => [...prev, ...next]);
      }
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("Error", "Could not open image picker.");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setCoverIndex((prevCover) => {
        if (next.length === 0) return 0;
        if (index === prevCover) return 0;
        if (index < prevCover) return prevCover - 1;
        return prevCover;
      });
      return next;
    });
  };

  const moveImage = (from: number, to: number) => {
    setImages((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      setCoverIndex((prevCover) => {
        if (from === prevCover) return to;
        if (from < prevCover && to >= prevCover) return prevCover - 1;
        if (from > prevCover && to <= prevCover) return prevCover + 1;
        return prevCover;
      });
      return next;
    });
  };

  const openDatePicker = () => {
    if (isWeb) return;
    setTouched((prev) => ({ ...prev, date: true }));
    setTempPickerDate(eventDate ?? new Date());
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    if (isWeb) return;
    setTouched((prev) => ({ ...prev, time: true }));
    setTempPickerDate(eventTime ?? new Date());
    setShowTimePicker(true);
  };

  const handleDateInput = (value: string) => {
    setEventDateInput(value);
    setTouched((prev) => ({ ...prev, date: true }));
    setEventDate(parseWebDate(value));
  };

  const handleTimeInput = (value: string) => {
    setEventTimeInput(value);
    setTouched((prev) => ({ ...prev, time: true }));
    setEventTime(parseWebTime(value));
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!isIOS) {
      if (event.type === "set" && selected) setEventDate(selected);
      setShowDatePicker(false);
      return;
    }
    if (selected) setTempPickerDate(selected);
  };

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!isIOS) {
      if (event.type === "set" && selected) setEventTime(selected);
      setShowTimePicker(false);
      return;
    }
    if (selected) setTempPickerDate(selected);
  };

  const confirmDate = () => {
    setEventDate(tempPickerDate);
    setShowDatePicker(false);
  };

  const confirmTime = () => {
    setEventTime(tempPickerDate);
    setShowTimePicker(false);
  };

  const uploadImageIfAny = async (userId: string): Promise<string | null> => {
    const uri = coverImage?.uri;
    if (!uri) return null;

    try {
      const res = await fetch(uri);
      if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.status}`);
      }

      const blob = await res.blob();
      const fileExt = "jpg";
      const timestamp = Date.now();
      const filePath = `${userId}/${timestamp}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("post-images")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadErr) throw uploadErr;
      return filePath;
    } catch (err: any) {
      console.error("Image upload failed:", err?.message || err);
      Alert.alert("Upload Error", `Failed to upload image: ${err?.message || "Unknown error"}`);
      return null;
    }
  };

  const handlePreview = () => {
    setTouched({ title: true, date: true, time: true, location: true });
    if (!canSubmit) return;
    setSubmitError(null);
    setStep("preview");
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!canSubmit) {
      setTouched({ title: true, date: true, time: true, location: true });
      Alert.alert("Missing info", "Please fill title, date, time, and location.");
      return;
    }

    setSubmitError(null);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      Alert.alert("Not signed in", "Please sign in again.");
      setSubmitError("You’re signed out. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const filePath = await uploadImageIfAny(user.id);
      if (coverImage && !filePath) {
        Alert.alert("Upload Failed", "Image upload failed. Post not created.");
        setSubmitError("Image upload failed. Please try again or post without a photo.");
        return;
      }

      const finalVisibility = selectedClubId ? visibility : "public";

      const payload = {
        user_id: user.id,
        title: eventTitle.trim(),
        description: description.trim() || null,
        image_url: filePath,
        location: eventLocation.trim(),
        event_date: combinedDateTime ? combinedDateTime.toISOString() : null,
        is_active: true,
        visibility: finalVisibility,
        club_id: selectedClubId ?? null,
      };

      const { error: insertErr } = await supabase.from("posts").insert(payload);
      if (insertErr) throw insertErr;

      Alert.alert("Success", "Post created!");
      router.replace("/explore");
    } catch (err: any) {
      console.error("Post creation error:", err);
      Alert.alert("Error", err?.message || "Unable to create post.");
      setSubmitError(err?.message || "Unable to create post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.massive }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Image source={require("../../assets/images/rslogo.png")} style={styles.leftLogo} />
          <View style={styles.titleBlock}>
            <GradientText fontFamily={typography.fonts.medium} fontSize={typography.sizes.display}>
              Create
            </GradientText>
            <Text style={styles.subtitle}>Share a campus moment in a few steps.</Text>
          </View>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>{step === "details" ? "Step 1" : "Step 2"} of 2</Text>
          </View>
        </View>

        {step === "details" ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <Text style={styles.sectionHint}>Add up to {MAX_IMAGES} images. First one is cover.</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                {images.map((item, index) => (
                  <View key={item.id} style={styles.imageCard}>
                    <Image source={{ uri: item.uri }} style={styles.imagePreview} />
                    {coverIndex === index && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>Cover</Text>
                      </View>
                    )}
                    <View style={styles.imageActions}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Move image left"
                        onPress={() => moveImage(index, index - 1)}
                        style={styles.actionIcon}
                        disabled={index === 0}
                      >
                        <Feather
                          name="chevron-left"
                          size={16}
                          color={index === 0 ? colors.textSubtle : colors.textMuted}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Move image right"
                        onPress={() => moveImage(index, index + 1)}
                        style={styles.actionIcon}
                        disabled={index === images.length - 1}
                      >
                        <Feather
                          name="chevron-right"
                          size={16}
                          color={index === images.length - 1 ? colors.textSubtle : colors.textMuted}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Set as cover"
                        onPress={() => setCoverIndex(index)}
                        style={styles.actionIcon}
                      >
                        <Feather name="star" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Remove image"
                        onPress={() => removeImage(index)}
                        style={styles.actionIcon}
                      >
                        <Feather name="trash-2" size={16} color={colors.primaryDark} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {images.length < MAX_IMAGES && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Add images"
                    onPress={pickImages}
                    style={styles.addImageCard}
                  >
                    <Feather name="plus" size={22} color={colors.primary} />
                    <Text style={styles.addImageText}>Add Photos</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Event Details</Text>
              <TextField
                label="Event Title"
                value={eventTitle}
                onChangeText={setEventTitle}
                onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                placeholder="Title"
                errorText={titleError}
                accessibilityLabel="Event Title"
              />

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  {isWeb ? (
                    <TextField
                      label="Date"
                      value={eventDateInput}
                      onChangeText={handleDateInput}
                      placeholder="YYYY-MM-DD"
                      errorText={dateError}
                      helperText="Format: YYYY-MM-DD"
                      keyboardType="numeric"
                      accessibilityLabel="Date"
                    />
                  ) : (
                    <SelectField
                      label="Date"
                      value={dateLabel}
                      placeholder="Select date"
                      onPress={openDatePicker}
                      errorText={dateError}
                      rightElement={<Feather name="calendar" size={18} color={colors.textMuted} />}
                    />
                  )}
                </View>
                <View style={styles.rowItem}>
                  {isWeb ? (
                    <TextField
                      label="Time"
                      value={eventTimeInput}
                      onChangeText={handleTimeInput}
                      placeholder="HH:MM"
                      errorText={timeError}
                      helperText="24-hour time (H:MM or HH:MM)"
                      keyboardType="numeric"
                      accessibilityLabel="Time"
                    />
                  ) : (
                    <SelectField
                      label="Time"
                      value={timeLabel}
                      placeholder="Select time"
                      onPress={openTimePicker}
                      errorText={timeError}
                      rightElement={<Feather name="clock" size={18} color={colors.textMuted} />}
                    />
                  )}
                </View>
              </View>

              <TextField
                label="Location"
                value={eventLocation}
                onChangeText={setEventLocation}
                onBlur={() => setTouched((prev) => ({ ...prev, location: true }))}
                placeholder="Start typing a location"
                errorText={locationError}
                accessibilityLabel="Location"
              />

              {locationSuggestions.length > 0 && (
                <View style={styles.suggestionList}>
                  {locationSuggestions.map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      style={styles.suggestionChip}
                      onPress={() => setEventLocation(loc)}
                    >
                      <Text style={styles.suggestionText}>{loc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TextField
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Add a short description"
                multiline
                style={styles.descriptionInput}
                accessibilityLabel="Description"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Posting As</Text>
              <SelectField
                label="Club"
                value={selectedClubName ?? ""}
                placeholder={authorizedClubs.length ? "Select a club (optional)" : "No authorized clubs"}
                onPress={() => setClubPickerOpen(true)}
                rightElement={<Feather name="chevron-down" size={18} color={colors.textMuted} />}
              />

              {selectedClubId && (
                <View style={styles.visibilityCard}>
                  <Text style={styles.visibilityLabel}>Visibility</Text>
                  <View style={styles.visibilityRow}>
                    <TouchableOpacity
                      onPress={() => setVisibility("public")}
                      style={[
                        styles.visibilityChip,
                        visibility === "public" && styles.visibilityChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.visibilityText,
                          visibility === "public" && styles.visibilityTextActive,
                        ]}
                      >
                        🌍 Public
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setVisibility("private")}
                      style={[
                        styles.visibilityChip,
                        visibility === "private" && styles.visibilityChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.visibilityText,
                          visibility === "private" && styles.visibilityTextActive,
                        ]}
                      >
                        🔒 Members Only
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.visibilityHint}>
                    {visibility === "public" ? "Everyone can see this post." : "Only club members can see this post."}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionRow}>
              <SecondaryButton title="Cancel" onPress={() => router.back()} />
              <PrimaryButton title="Preview" onPress={handlePreview} disabled={!canSubmit} />
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              {coverImage ? (
                <Image source={{ uri: coverImage.uri }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewImagePlaceholder}>
                  <Feather name="image" size={28} color={colors.textSubtle} />
                  <Text style={styles.previewPlaceholderText}>No cover image</Text>
                </View>
              )}
              <View style={styles.previewContent}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>{eventTitle || "Untitled"}</Text>
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>{selectedClubName ?? "Personal"}</Text>
                  </View>
                </View>
                <Text style={styles.previewMeta}>{dateTimeLabel || "Date & time"}</Text>
                <Text style={styles.previewMeta}>{eventLocation || "Location"}</Text>
                {description.trim() ? <Text style={styles.previewDescription}>{description}</Text> : null}
              </View>
            </View>

            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

            <View style={styles.actionRow}>
              <SecondaryButton title="Edit Details" onPress={() => setStep("details")} />
              <PrimaryButton title="Post Event" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} />
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={clubPickerOpen} transparent animationType="fade" onRequestClose={() => setClubPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select a club</Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {authorizedClubs.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedClubId(club.id);
                    setClubPickerOpen(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{club.name}</Text>
                </TouchableOpacity>
              ))}
              {authorizedClubs.length === 0 && (
                <Text style={styles.modalEmpty}>You are not authorized to post for any clubs.</Text>
              )}
            </ScrollView>
            {selectedClubId && (
              <TouchableOpacity
                style={styles.clearClubButton}
                onPress={() => {
                  setSelectedClubId(null);
                  setVisibility("public");
                  setClubPickerOpen(false);
                }}
              >
                <Text style={styles.clearClubText}>Clear selection</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setClubPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isIOS ? (
        <>
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.pickerBackdrop}>
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Select a date</Text>
                <DateTimePicker
                  value={tempPickerDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
                <PrimaryButton title="Done" onPress={confirmDate} />
              </View>
            </View>
          </Modal>

          <Modal
            visible={showTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.pickerBackdrop}>
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Select a time</Text>
                <DateTimePicker
                  value={tempPickerDate}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                />
                <PrimaryButton title="Done" onPress={confirmTime} />
              </View>
            </View>
          </Modal>
        </>
      ) : isAndroid ? (
        <>
          {showDatePicker && (
            <DateTimePicker
              value={eventDate ?? new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={eventTime ?? new Date()}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  leftLogo: {
    width: 72,
    height: 72,
    resizeMode: "contain",
  },
  titleBlock: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  stepPill: {
    backgroundColor: colors.surfaceTint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stepPillText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.primaryDark,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  sectionHint: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  imageRow: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  imageCard: {
    width: 160,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 120,
  },
  coverBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  coverBadgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.primaryDark,
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  actionIcon: {
    padding: spacing.xs,
  },
  addImageCard: {
    width: 160,
    height: 160,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  addImageText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primaryDark,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  suggestionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  suggestionChip: {
    backgroundColor: colors.chip,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  suggestionText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.chipText,
  },
  descriptionInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  visibilityCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceTint,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  visibilityLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  visibilityRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  visibilityChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  visibilityChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  visibilityText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.textMuted,
  },
  visibilityTextActive: {
    color: colors.surface,
  },
  visibilityHint: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  previewCard: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  previewImage: {
    width: "100%",
    height: 200,
  },
  previewImagePlaceholder: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTint,
    gap: spacing.xs,
  },
  previewPlaceholderText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textSubtle,
  },
  previewContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  previewTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  previewBadge: {
    backgroundColor: colors.surfaceTint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  previewBadgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.primaryDark,
  },
  previewMeta: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  previewDescription: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text,
    lineHeight: typography.lineHeights.lg,
  },
  submitError: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "88%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  modalItemText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text,
  },
  modalEmpty: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    paddingVertical: spacing.sm,
  },
  clearClubButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  clearClubText: {
    color: colors.primaryDark,
    fontFamily: typography.fonts.semibold,
  },
  modalClose: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  modalCloseText: {
    color: colors.textMuted,
    fontFamily: typography.fonts.semibold,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerCard: {
    width: "88%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.md,
  },
  pickerTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
});
