import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientText from "../../../components/GradientText";
import PrimaryButton from "../../../components/buttons/PrimaryButton";
import SecondaryButton from "../../../components/buttons/SecondaryButton";
import SelectField from "../../../components/forms/SelectField";
import TextField from "../../../components/forms/TextField";
import { supabase } from "../../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../../styles/tokens";

type PostRow = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  location: string | null;
  event_date: string | null;
  visibility: "public" | "private" | null;
  club_id: string | null;
};

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

export default function EditPost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;

  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [eventTime, setEventTime] = useState<Date | null>(null);
  const [eventDateInput, setEventDateInput] = useState("");
  const [eventTimeInput, setEventTimeInput] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [clubName, setClubName] = useState<string | null>(null);
  const [hasClub, setHasClub] = useState(false);

  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempPickerDate, setTempPickerDate] = useState(new Date());
  const [touched, setTouched] = useState({
    title: false,
    date: false,
    time: false,
    location: false,
  });

  const combinedDateTime = useMemo(() => {
    if (!eventDate || !eventTime) return null;
    const combined = new Date(eventDate);
    combined.setHours(eventTime.getHours(), eventTime.getMinutes(), 0, 0);
    return combined;
  }, [eventDate, eventTime]);

  const titleError = useMemo(() => {
    if (!touched.title) return "";
    if (!title.trim()) return "Title is required.";
    return "";
  }, [title, touched.title]);

  const dateError = useMemo(() => {
    if (!touched.date) return "";
    if (!eventDate) return "Date is required.";
    return "";
  }, [eventDate, touched.date]);

  const timeError = useMemo(() => {
    if (!touched.time) return "";
    if (!eventTime) return "Time is required.";
    return "";
  }, [eventTime, touched.time]);

  const locationError = useMemo(() => {
    if (!touched.location) return "";
    if (!location.trim()) return "Location is required.";
    return "";
  }, [location, touched.location]);

  const canSave =
    title.trim().length > 0 &&
    location.trim().length > 0 &&
    !!eventDate &&
    !!eventTime;

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setError("Missing post id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const user = authData?.user;
        if (!user) {
          router.replace("/");
          return;
        }

        const { data, error: postError } = await supabase
          .from("posts")
          .select("id, title, description, image_url, location, event_date, visibility, club_id")
          .eq("id", postId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (postError) throw postError;
        if (!data) {
          setError("Post not found.");
          return;
        }

        const post = data as PostRow;
        setTitle(post.title ?? "");
        setDescription(post.description ?? "");
        setLocation(post.location ?? "");
        setVisibility(post.visibility === "private" ? "private" : "public");

        if (post.event_date) {
          // Try parsing the human-readable format: "Mar 14, 2026 • 12:30 PM" or "Mar 14, 2026 • 12:30 PM - 4:20 PM"
          const parts = post.event_date.split("•").map((p: string) => p.trim());
          let parsed: Date | null = null;
          if (parts.length >= 2) {
            const timePart = parts[1].split(" - ")[0].trim();
            const candidate = new Date(`${parts[0]} ${timePart}`);
            if (!Number.isNaN(candidate.getTime())) parsed = candidate;
          }
          // Fallback: try parsing as ISO date
          if (!parsed) {
            const candidate = new Date(post.event_date);
            if (!Number.isNaN(candidate.getTime())) parsed = candidate;
          }
          if (parsed) {
            setEventDate(parsed);
            setEventTime(parsed);
            if (isWeb) {
              setEventDateInput(formatWebDate(parsed));
              setEventTimeInput(formatWebTime(parsed));
            }
          }
        }

        if (post.image_url) {
          setImagePath(post.image_url);
          const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(post.image_url);
          setImagePreview(urlData?.publicUrl ?? null);
        }

        if (post.club_id) {
          setHasClub(true);
          const { data: clubData } = await supabase
            .from("clubs")
            .select("name")
            .eq("id", post.club_id)
            .maybeSingle();
          setClubName(clubData?.name ?? null);
        } else {
          setHasClub(false);
        }
      } catch (err: any) {
        setError(err?.message || "Unable to load the post.");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [isWeb, postId, router]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      if (!permission.canAskAgain) {
        Alert.alert(
          "Permission needed",
          "Please enable photo access in settings to update your image.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert("Permission needed", "Allow photo access to update your image.");
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setPendingImageUri(asset.uri);
    setImagePreview(asset.uri);
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setPendingImageUri(null);
    setImagePreview(null);
    setRemoveImage(true);
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

  const uploadImageIfAny = async (userId: string): Promise<string | null> => {
    if (!pendingImageUri) return null;

    const res = await fetch(pendingImageUri);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    const blob = await res.blob();
    const filePath = `${userId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from("post-images").upload(filePath, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (uploadError) throw uploadError;
    return filePath;
  };

  const handleSave = async () => {
    if (saving) return;
    if (!postId) {
      setError("Missing post id.");
      return;
    }
    setTouched({ title: true, date: true, time: true, location: true });
    if (!canSave) return;

    setSaving(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }

      let nextImagePath = imagePath;
      if (removeImage) nextImagePath = null;
      if (pendingImageUri) {
        nextImagePath = await uploadImageIfAny(user.id);
      }

      // Format event_date as human-readable string matching createPost format
      // Example: "Mar 14, 2026 • 12:30 PM"
      let eventDateStr: string | null = null;
      if (combinedDateTime) {
        const dateStr = combinedDateTime.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const timeStr = combinedDateTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
        eventDateStr = `${dateStr} • ${timeStr}`;
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim(),
        event_date: eventDateStr,
        visibility: hasClub ? visibility : "public",
        image_url: nextImagePath,
      };

      const { error: updateError } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", postId)
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      if ((removeImage || pendingImageUri) && imagePath && imagePath !== nextImagePath) {
        await supabase.storage.from("post-images").remove([imagePath]);
      }

      Alert.alert("Saved", "Your post has been updated.");
      router.back();
    } catch (err: any) {
      setError(err?.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.massive },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <GradientText fontFamily={typography.fonts.medium} fontSize={typography.sizes.xxxl}>
              Edit Post
            </GradientText>
            <Text style={styles.subtitle}>Update the details of your event.</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.imageCard}>
          {imagePreview ? (
            <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="image" size={28} color={colors.textSubtle} />
              <Text style={styles.placeholderText}>No image</Text>
            </View>
          )}
          <View style={styles.imageActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change image"
              onPress={handlePickImage}
              style={styles.imageButton}
            >
              <Feather name="image" size={16} color={colors.primaryDark} />
              <Text style={styles.imageButtonText}>Change photo</Text>
            </TouchableOpacity>
            {imagePreview ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Remove image"
                onPress={handleRemoveImage}
                style={styles.removeButton}
              >
                <Feather name="x" size={16} color={colors.textMuted} />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.formCard}>
          <TextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
            placeholder="Event title"
            errorText={titleError}
          />

          <TextField
            label="Location"
            value={location}
            onChangeText={setLocation}
            onBlur={() => setTouched((prev) => ({ ...prev, location: true }))}
            placeholder="Location"
            errorText={locationError}
          />

          {isWeb ? (
            <>
              <TextField
                label="Date"
                value={eventDateInput}
                onChangeText={handleDateInput}
                onBlur={() => setTouched((prev) => ({ ...prev, date: true }))}
                placeholder="YYYY-MM-DD"
                errorText={dateError}
              />
              <TextField
                label="Time"
                value={eventTimeInput}
                onChangeText={handleTimeInput}
                onBlur={() => setTouched((prev) => ({ ...prev, time: true }))}
                placeholder="HH:MM"
                errorText={timeError}
              />
            </>
          ) : (
            <>
              <SelectField
                label="Date"
                value={eventDate ? formatDate(eventDate) : ""}
                placeholder="Select a date"
                onPress={openDatePicker}
                errorText={dateError}
                rightElement={<Feather name="calendar" size={18} color={colors.textMuted} />}
              />
              <SelectField
                label="Time"
                value={eventTime ? formatTime(eventTime) : ""}
                placeholder="Select a time"
                onPress={openTimePicker}
                errorText={timeError}
                rightElement={<Feather name="clock" size={18} color={colors.textMuted} />}
              />
            </>
          )}

          <View style={styles.descriptionField}>
            <Text style={styles.fieldLabel}>Description</Text>
            <View style={styles.textAreaWrap}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add more details about the event"
                placeholderTextColor={colors.textSubtle}
                multiline
                textAlignVertical="top"
                style={styles.textArea}
              />
            </View>
          </View>

          <View style={styles.visibilityRow}>
            <Text style={styles.fieldLabel}>Visibility</Text>
            <View style={styles.visibilityControls}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Set visibility to public"
                onPress={() => setVisibility("public")}
                style={[
                  styles.visibilityButton,
                  visibility === "public" && styles.visibilityButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.visibilityButtonText,
                    visibility === "public" && styles.visibilityButtonTextActive,
                  ]}
                >
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Set visibility to private"
                onPress={() => setVisibility("private")}
                disabled={!hasClub}
                style={[
                  styles.visibilityButton,
                  visibility === "private" && styles.visibilityButtonActive,
                  !hasClub && styles.visibilityButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.visibilityButtonText,
                    visibility === "private" && styles.visibilityButtonTextActive,
                    !hasClub && styles.visibilityButtonTextDisabled,
                  ]}
                >
                  Private
                </Text>
              </TouchableOpacity>
            </View>
            {!hasClub ? (
              <Text style={styles.helperText}>Private visibility is only for club posts.</Text>
            ) : clubName ? (
              <Text style={styles.helperText}>Club: {clubName}</Text>
            ) : null}
          </View>
        </View>

        <PrimaryButton title="Save changes" onPress={handleSave} loading={saving} disabled={!canSave} />
        <SecondaryButton title="Cancel" onPress={() => router.back()} />
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={tempPickerDate}
          mode="date"
          display={isIOS ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}
      {showDatePicker && isIOS && (
        <View style={styles.pickerFooter}>
          <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.pickerButton}>
            <Text style={styles.pickerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDate} style={styles.pickerButton}>
            <Text style={styles.pickerButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {showTimePicker && (
        <DateTimePicker
          value={tempPickerDate}
          mode="time"
          display={isIOS ? "spinner" : "default"}
          onChange={handleTimeChange}
        />
      )}
      {showTimePicker && isIOS && (
        <View style={styles.pickerFooter}>
          <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.pickerButton}>
            <Text style={styles.pickerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmTime} style={styles.pickerButton}>
            <Text style={styles.pickerButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
  },
  imageCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    ...shadows.soft,
  },
  imagePreview: {
    width: "100%",
    height: 220,
  },
  imagePlaceholder: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTint,
    gap: spacing.xs,
  },
  placeholderText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textSubtle,
  },
  imageActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  imageButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primaryDark,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  removeButtonText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.textMuted,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
  },
  descriptionField: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  textAreaWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textArea: {
    minHeight: 100,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text,
  },
  visibilityRow: {
    gap: spacing.sm,
  },
  visibilityControls: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  visibilityButton: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  visibilityButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  visibilityButtonDisabled: {
    opacity: 0.5,
  },
  visibilityButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.primaryDark,
  },
  visibilityButtonTextActive: {
    color: colors.surface,
  },
  visibilityButtonTextDisabled: {
    color: colors.textMuted,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  pickerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  pickerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },
});
