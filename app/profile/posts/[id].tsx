import { Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
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

// Format date for display (MM-DD-YYYY)
const formatDateDisplay = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
};

// Format time as 12-hour with AM/PM
const formatTime12Hour = (date: Date) => {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

// Format for storage (matches createPost.tsx format)
const formatDateForStorage = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTimeForStorage = (date: Date) =>
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

// Parse the stored event_date format: "Mar 14, 2026 • 12:30 PM - 4:20 PM" or ISO string
const parseStoredEventDate = (value: string | null): { date: Date | null; startTime: Date | null; endTime: Date | null } => {
  if (!value) return { date: null, startTime: null, endTime: null };

  // Check if it's an ISO string (from old edit saves)
  if (value.includes("T") && value.includes("Z")) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return { date: parsed, startTime: parsed, endTime: null };
    }
  }

  // Parse the formatted string: "Mar 14, 2026 • 12:30 PM - 4:20 PM"
  const parts = value.split("•").map((part) => part.trim());
  if (parts.length < 2) {
    const guess = new Date(parts[0]);
    return Number.isNaN(guess.getTime()) 
      ? { date: null, startTime: null, endTime: null }
      : { date: guess, startTime: guess, endTime: null };
  }

  const datePart = parts[0]; // "Mar 14, 2026"
  const timePart = parts[1]; // "12:30 PM - 4:20 PM" or "12:30 PM"

  // Parse the time range
  const timeRange = timePart.split(" - ").map((t) => t.trim());
  const startTimeStr = timeRange[0];
  const endTimeStr = timeRange[1] || null;

  // Parse start date/time
  const startDateTime = new Date(`${datePart} ${startTimeStr}`);
  if (Number.isNaN(startDateTime.getTime())) {
    return { date: null, startTime: null, endTime: null };
  }

  // Parse end time if exists
  let endDateTime: Date | null = null;
  if (endTimeStr) {
    endDateTime = new Date(`${datePart} ${endTimeStr}`);
    if (Number.isNaN(endDateTime.getTime())) {
      endDateTime = null;
    }
  }

  return { 
    date: startDateTime, 
    startTime: startDateTime, 
    endTime: endDateTime 
  };
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
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [eventDateInput, setEventDateInput] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [clubName, setClubName] = useState<string | null>(null);
  const [hasClub, setHasClub] = useState(false);

  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempPickerDate, setTempPickerDate] = useState(new Date());

  // Web time inputs
  const [startAmPm, setStartAmPm] = useState<"AM" | "PM">("AM");
  const [endAmPm, setEndAmPm] = useState<"AM" | "PM">("PM");
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");

  const [touched, setTouched] = useState({
    title: false,
    date: false,
    startTime: false,
    endTime: false,
    location: false,
  });

  // Combined date/time for storage
  const combinedStartDateTime = eventDate && startTime
    ? new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        startTime.getHours(),
        startTime.getMinutes(),
        0,
        0
      )
    : null;

  const combinedEndDateTime = eventDate && endTime
    ? new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        endTime.getHours(),
        endTime.getMinutes(),
        0,
        0
      )
    : null;

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

  const startTimeError = useMemo(() => {
    if (!touched.startTime) return "";
    if (!startTime) return "Start time is required.";
    return "";
  }, [startTime, touched.startTime]);

  const endTimeError = useMemo(() => {
    if (!touched.endTime) return "";
    if (!endTime) return "End time is required.";
    return "";
  }, [endTime, touched.endTime]);

  const locationError = useMemo(() => {
    if (!touched.location) return "";
    if (!location.trim()) return "Location is required.";
    return "";
  }, [location, touched.location]);

  const canSave =
    title.trim().length > 0 &&
    location.trim().length > 0 &&
    !!eventDate &&
    !!startTime &&
    !!endTime;

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

        // Parse the stored event_date
        if (post.event_date) {
          const { date, startTime: parsedStart, endTime: parsedEnd } = parseStoredEventDate(post.event_date);
          if (date) {
            setEventDate(date);
            if (isWeb) {
              setEventDateInput(formatWebDate(date));
            }
          }
          if (parsedStart) {
            setStartTime(parsedStart);
            if (isWeb) {
              const hours = parsedStart.getHours();
              const minutes = parsedStart.getMinutes();
              setStartHour(String(hours > 12 ? hours - 12 : hours === 0 ? 12 : hours));
              setStartMinute(String(minutes).padStart(2, "0"));
              setStartAmPm(hours >= 12 ? "PM" : "AM");
            }
          }
          if (parsedEnd) {
            setEndTime(parsedEnd);
            if (isWeb) {
              const hours = parsedEnd.getHours();
              const minutes = parsedEnd.getMinutes();
              setEndHour(String(hours > 12 ? hours - 12 : hours === 0 ? 12 : hours));
              setEndMinute(String(minutes).padStart(2, "0"));
              setEndAmPm(hours >= 12 ? "PM" : "AM");
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

  const openStartTimePicker = () => {
    if (isWeb) return;
    setTouched((prev) => ({ ...prev, startTime: true }));
    setTempPickerDate(startTime ?? new Date());
    setShowStartTimePicker(true);
  };

  const openEndTimePicker = () => {
    if (isWeb) return;
    setTouched((prev) => ({ ...prev, endTime: true }));
    setTempPickerDate(endTime ?? new Date());
    setShowEndTimePicker(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!isIOS) {
      if (event.type === "set" && selected) setEventDate(selected);
      setShowDatePicker(false);
      return;
    }
    if (selected) setTempPickerDate(selected);
  };

  const handleStartTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!isIOS) {
      if (event.type === "set" && selected) setStartTime(selected);
      setShowStartTimePicker(false);
      return;
    }
    if (selected) setTempPickerDate(selected);
  };

  const handleEndTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!isIOS) {
      if (event.type === "set" && selected) setEndTime(selected);
      setShowEndTimePicker(false);
      return;
    }
    if (selected) setTempPickerDate(selected);
  };

  const confirmDate = () => {
    setEventDate(tempPickerDate);
    setShowDatePicker(false);
  };

  const confirmStartTime = () => {
    setStartTime(tempPickerDate);
    setShowStartTimePicker(false);
  };

  const confirmEndTime = () => {
    setEndTime(tempPickerDate);
    setShowEndTimePicker(false);
  };

  const handleDateInput = (value: string) => {
    setEventDateInput(value);
    setTouched((prev) => ({ ...prev, date: true }));
    setEventDate(parseWebDate(value));
  };

  // Web time input handlers
  const updateStartTimeFromWeb = (hour: string, minute: string, ampm: "AM" | "PM") => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) {
      setStartTime(null);
      return;
    }
    let hour24 = h;
    if (ampm === "AM" && h === 12) hour24 = 0;
    else if (ampm === "PM" && h !== 12) hour24 = h + 12;
    
    const time = new Date();
    time.setHours(hour24, m, 0, 0);
    setStartTime(time);
  };

  const updateEndTimeFromWeb = (hour: string, minute: string, ampm: "AM" | "PM") => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) {
      setEndTime(null);
      return;
    }
    let hour24 = h;
    if (ampm === "AM" && h === 12) hour24 = 0;
    else if (ampm === "PM" && h !== 12) hour24 = h + 12;
    
    const time = new Date();
    time.setHours(hour24, m, 0, 0);
    setEndTime(time);
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
    setTouched({ title: true, date: true, startTime: true, endTime: true, location: true });
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

      // FORMAT EVENT_DATE THE SAME WAY AS createPost.tsx
      // Example: "Mar 14, 2026 • 12:30 PM - 4:20 PM"
      let eventDateTimeStr: string | null = null;
      if (combinedStartDateTime) {
        const dateStr = formatDateForStorage(combinedStartDateTime);
        const startTimeStr = formatTimeForStorage(combinedStartDateTime);
        if (combinedEndDateTime) {
          const endTimeStr = formatTimeForStorage(combinedEndDateTime);
          eventDateTimeStr = `${dateStr} • ${startTimeStr} - ${endTimeStr}`;
        } else {
          eventDateTimeStr = `${dateStr} • ${startTimeStr}`;
        }
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim(),
        event_date: eventDateTimeStr, // NOW USES FORMATTED STRING INSTEAD OF ISO
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

  const dateLabel = eventDate ? formatDateDisplay(eventDate) : "";
  const startTimeLabel = startTime ? formatTime12Hour(startTime) : "";
  const endTimeLabel = endTime ? formatTime12Hour(endTime) : "";

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
            label="Event Title"
            value={title}
            onChangeText={setTitle}
            onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
            placeholder="What's happening?"
            autoCapitalize="sentences"
            returnKeyType="next"
            errorText={titleError}
            accessibilityLabel="Event Title"
          />

          <TextField
            label="Location"
            value={location}
            onChangeText={setLocation}
            onBlur={() => setTouched((prev) => ({ ...prev, location: true }))}
            placeholder="Where is it?"
            returnKeyType="next"
            errorText={locationError}
            accessibilityLabel="Location"
          />

          {/* Date Picker */}
          {isWeb ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Event Date</Text>
              <TextInput
                value={eventDateInput}
                onChangeText={handleDateInput}
                placeholder="YYYY-MM-DD"
                style={styles.webInput}
              />
              {dateError ? <Text style={styles.errorTextSmall}>{dateError}</Text> : null}
            </View>
          ) : (
            <TouchableOpacity onPress={openDatePicker} style={styles.pickerButton}>
              <Text style={styles.fieldLabel}>Event Date</Text>
              <Text style={[styles.pickerValue, !eventDate && styles.pickerPlaceholder]}>
                {dateLabel || "Select date"}
              </Text>
              {dateError ? <Text style={styles.errorTextSmall}>{dateError}</Text> : null}
            </TouchableOpacity>
          )}

          {/* Start Time Picker */}
          {isWeb ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Start Time</Text>
              <View style={styles.timeInputRow}>
                <TextInput
                  value={startHour}
                  onChangeText={(v) => {
                    setStartHour(v);
                    updateStartTimeFromWeb(v, startMinute, startAmPm);
                  }}
                  placeholder="HH"
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.timeInputSmall}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput
                  value={startMinute}
                  onChangeText={(v) => {
                    setStartMinute(v);
                    updateStartTimeFromWeb(startHour, v, startAmPm);
                  }}
                  placeholder="MM"
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.timeInputSmall}
                />
                <View style={styles.amPmToggle}>
                  <TouchableOpacity
                    onPress={() => {
                      setStartAmPm("AM");
                      updateStartTimeFromWeb(startHour, startMinute, "AM");
                    }}
                    style={[styles.amPmButton, startAmPm === "AM" && styles.amPmButtonActive]}
                  >
                    <Text style={[styles.amPmText, startAmPm === "AM" && styles.amPmTextActive]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setStartAmPm("PM");
                      updateStartTimeFromWeb(startHour, startMinute, "PM");
                    }}
                    style={[styles.amPmButton, startAmPm === "PM" && styles.amPmButtonActive]}
                  >
                    <Text style={[styles.amPmText, startAmPm === "PM" && styles.amPmTextActive]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {startTimeError ? <Text style={styles.errorTextSmall}>{startTimeError}</Text> : null}
            </View>
          ) : (
            <TouchableOpacity onPress={openStartTimePicker} style={styles.pickerButton}>
              <Text style={styles.fieldLabel}>Start Time</Text>
              <Text style={[styles.pickerValue, !startTime && styles.pickerPlaceholder]}>
                {startTimeLabel || "Select start time"}
              </Text>
              {startTimeError ? <Text style={styles.errorTextSmall}>{startTimeError}</Text> : null}
            </TouchableOpacity>
          )}

          {/* End Time Picker */}
          {isWeb ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>End Time</Text>
              <View style={styles.timeInputRow}>
                <TextInput
                  value={endHour}
                  onChangeText={(v) => {
                    setEndHour(v);
                    updateEndTimeFromWeb(v, endMinute, endAmPm);
                  }}
                  placeholder="HH"
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.timeInputSmall}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput
                  value={endMinute}
                  onChangeText={(v) => {
                    setEndMinute(v);
                    updateEndTimeFromWeb(endHour, v, endAmPm);
                  }}
                  placeholder="MM"
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.timeInputSmall}
                />
                <View style={styles.amPmToggle}>
                  <TouchableOpacity
                    onPress={() => {
                      setEndAmPm("AM");
                      updateEndTimeFromWeb(endHour, endMinute, "AM");
                    }}
                    style={[styles.amPmButton, endAmPm === "AM" && styles.amPmButtonActive]}
                  >
                    <Text style={[styles.amPmText, endAmPm === "AM" && styles.amPmTextActive]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEndAmPm("PM");
                      updateEndTimeFromWeb(endHour, endMinute, "PM");
                    }}
                    style={[styles.amPmButton, endAmPm === "PM" && styles.amPmButtonActive]}
                  >
                    <Text style={[styles.amPmText, endAmPm === "PM" && styles.amPmTextActive]}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {endTimeError ? <Text style={styles.errorTextSmall}>{endTimeError}</Text> : null}
            </View>
          ) : (
            <TouchableOpacity onPress={openEndTimePicker} style={styles.pickerButton}>
              <Text style={styles.fieldLabel}>End Time</Text>
              <Text style={[styles.pickerValue, !endTime && styles.pickerPlaceholder]}>
                {endTimeLabel || "Select end time"}
              </Text>
              {endTimeError ? <Text style={styles.errorTextSmall}>{endTimeError}</Text> : null}
            </TouchableOpacity>
          )}

          <View style={styles.descriptionField}>
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <View style={styles.textAreaWrap}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell people more about this event..."
                placeholderTextColor={colors.textSubtle}
                multiline
                textAlignVertical="top"
                style={styles.textArea}
                accessibilityLabel="Description"
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

      {/* Native Date Picker */}
      {showDatePicker && !isWeb && (
        <DateTimePicker
          value={tempPickerDate}
          mode="date"
          display={isIOS ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}
      {showDatePicker && isIOS && (
        <View style={styles.pickerFooter}>
          <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.pickerFooterButton}>
            <Text style={styles.pickerFooterButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDate} style={styles.pickerFooterButton}>
            <Text style={styles.pickerFooterButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Native Start Time Picker */}
      {showStartTimePicker && !isWeb && (
        <DateTimePicker
          value={tempPickerDate}
          mode="time"
          display={isIOS ? "spinner" : "default"}
          onChange={handleStartTimeChange}
        />
      )}
      {showStartTimePicker && isIOS && (
        <View style={styles.pickerFooter}>
          <TouchableOpacity onPress={() => setShowStartTimePicker(false)} style={styles.pickerFooterButton}>
            <Text style={styles.pickerFooterButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmStartTime} style={styles.pickerFooterButton}>
            <Text style={styles.pickerFooterButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Native End Time Picker */}
      {showEndTimePicker && !isWeb && (
        <DateTimePicker
          value={tempPickerDate}
          mode="time"
          display={isIOS ? "spinner" : "default"}
          onChange={handleEndTimeChange}
        />
      )}
      {showEndTimePicker && isIOS && (
        <View style={styles.pickerFooter}>
          <TouchableOpacity onPress={() => setShowEndTimePicker(false)} style={styles.pickerFooterButton}>
            <Text style={styles.pickerFooterButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmEndTime} style={styles.pickerFooterButton}>
            <Text style={styles.pickerFooterButtonText}>Confirm</Text>
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
  errorTextSmall: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
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
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  webInput: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  pickerButton: {
    marginBottom: spacing.lg,
  },
  pickerValue: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  pickerPlaceholder: {
    color: colors.textSubtle,
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  timeInputSmall: {
    width: 50,
    textAlign: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text,
  },
  timeSeparator: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  amPmToggle: {
    flexDirection: "row",
    marginLeft: spacing.sm,
  },
  amPmButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  amPmButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  amPmText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
  },
  amPmTextActive: {
    color: colors.surface,
  },
  descriptionField: {
    marginBottom: spacing.lg,
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
  pickerFooterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerFooterButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },
});