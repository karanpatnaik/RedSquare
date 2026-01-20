import { Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import GradientText from "../../components/GradientText";
import { supabase } from "../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";

type ClubOption = { id: string; name: string };

type ImageItem = {
  id: string;
  uri: string;
};

type Step = "details" | "preview";

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
  "Southwest Quad",
  "Car Barn",
  "McDonough Arena",

  // Academic Buildings
  "White-Gravenor Hall",
  "Intercultural Center (ICC)",
  "St. Mary's Hall",
  "Old North",
  "New North",
  "Walsh Building",
  "Healy Family Student Center",
  "Rafik B. Hariri Building",
  "Mortara Center",
  "Preston Hall",
  "Reiss Building",
  "Maguire Hall",
  "Basic Science Building",
  "Research Building",
  "New Research Building",
  "Med-Dent Building",

  // Libraries
  "Lauinger Library",
  "Bioethics Library",
  "Blommer Science Library",
  "Williams Law Library",

  // Residence Halls
  "Darnall Hall",
  "Harbin Hall",
  "Kennedy Hall",
  "Village A",
  "Village B",
  "Village C",
  "Village D",
  "Nevils Hall",
  "LXR Hall",
  "Copley Hall",
  "Reynolds Hall",
  "Arrupe Hall",
  "Freedom Hall",
  "Henle Village",
  "Jesuit Residence",

  // Dining
  "Leo J. O'Donovan Dining Hall",
  "Epi's",
  "Royal Jacket",
  "Hilltoss",
  "Crop Chop",
  "Groundswell",
  "Chick-fil-A (Leavey)",
  "Starbucks (Leavey)",
  "Vital Vittles",

  // Athletic & Recreation
  "Yates Field House",
  "Kehoe Field",
  "Cooper Field",
  "Guy Mason Tennis Courts",
  "Shaw Field",
  "Thompson Boat Center",

  // Chapels & Religious
  "Dahlgren Chapel",
  "Sacred Heart Chapel",
  "McElroy Hall Chapel",

  // Quads & Outdoor Landmarks
  "Copley Lawn",
  "Healy Gates",
  "Prospect Street Gates",
  "37th and O Gates",
  "White-Gravenor Steps",
  "The Tombs",
  "Wisey's",
  "Red Square Steps",

  // Student & Administrative
  "Office of Student Financial Services",
  "Office of Undergraduate Admissions",
  "Registrar's Office",
  "Career Center",
  "Center for Student Engagement",
  "GUPD Headquarters",

  // Medical Campus (if included)
  "Georgetown University Hospital",
  "Pasquerilla Healthcare Center",
  "Medical Center Plaza",

  // Misc / Iconic
  "Exorcist Steps",
  "Canal Road Entrance",
  "Prospect House"
];


// Format date as MM-DD-YYYY
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
  hours = hours ? hours : 12; // 0 should be 12
  return `${hours}:${minutes} ${ampm}`;
};

// Format for web input (still YYYY-MM-DD for HTML date input)
const formatWebDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Parse MM-DD-YYYY format
const parseMMDDYYYY = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(trimmed);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
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

// Parse web date input (YYYY-MM-DD)
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

// Get today's date at midnight for comparison
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Get max date (2 months from now)
const getMaxDate = () => {
  const max = new Date();
  max.setMonth(max.getMonth() + 2);
  max.setHours(23, 59, 59, 999);
  return max;
};

// Validate date is not in the past and not more than 2 months ahead
const validateEventDate = (date: Date | null): string => {
  if (!date) return "";
  const today = getToday();
  const maxDate = getMaxDate();
  
  if (date < today) {
    return "Event date cannot be in the past.";
  }
  if (date > maxDate) {
    return "Event date cannot be more than 2 months in advance.";
  }
  return "";
};

// Check if event spans overnight (end time appears before start time)
const isOvernightEvent = (startTime: Date | null, endTime: Date | null): boolean => {
  if (!startTime || !endTime) return false;

  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

  return endMinutes <= startMinutes;
};

export default function CreatePost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const isAndroid = Platform.OS === "android";

  const [step, setStep] = useState<Step>("details");
  const [image, setImage] = useState<ImageItem | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [eventDateInput, setEventDateInput] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [description, setDescription] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const [authorizedClubs, setAuthorizedClubs] = useState<ClubOption[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const [clubPickerOpen, setClubPickerOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempPickerDate, setTempPickerDate] = useState(new Date());

  // AM/PM selection for web
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedClubName = selectedClubId
    ? authorizedClubs.find((club) => club.id === selectedClubId)?.name
    : null;

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

  const dateLabel = eventDate ? formatDateDisplay(eventDate) : "";
  const startTimeLabel = startTime ? formatTime12Hour(startTime) : "";
  const endTimeLabel = endTime ? formatTime12Hour(endTime) : "";

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

  // For overnight events, the end time is on the next day
  const combinedEndDateTime = eventDate && endTime
    ? (() => {
        const endDate = new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate(),
          endTime.getHours(),
          endTime.getMinutes(),
          0,
          0
        );
        // If end time is before or equal to start time, it's an overnight event
        if (startTime) {
          const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
          const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
          if (endMinutes <= startMinutes) {
            endDate.setDate(endDate.getDate() + 1); // Add one day
          }
        }
        return endDate;
      })()
    : null;

  const dateTimeLabel = combinedStartDateTime && combinedEndDateTime
    ? `${formatDateDisplay(combinedStartDateTime)} • ${formatTime12Hour(combinedStartDateTime)} - ${formatTime12Hour(combinedEndDateTime)}`
    : "";

  // Validation errors
  const titleError = touched.title && !eventTitle.trim() ? "Event title is required." : "";
  const dateValidationError = validateEventDate(eventDate);
  const dateError = touched.date && !eventDate 
    ? "Select a date." 
    : touched.date && dateValidationError 
    ? dateValidationError 
    : "";
  const startTimeError = touched.startTime && !startTime ? "Select a start time." : "";
  const endTimeError = touched.endTime && !endTime ? "Select an end time." : "";
  const locationError = touched.location && !eventLocation.trim() ? "Location is required." : "";
  const overnight = isOvernightEvent(startTime, endTime);

  const canSubmit = !!(
    eventTitle.trim() &&
    eventDate &&
    !dateValidationError &&
    startTime &&
    endTime &&
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

  const pickImage = async () => {
    const ok = await ensureMediaPermission();
    if (!ok) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets[0]) {
        setImage({
          id: `${Date.now()}`,
          uri: result.assets[0].uri,
        });
      }
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("Error", "Could not open image picker.");
    }
  };

  const removeImage = () => {
    setImage(null);
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

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!isIOS) {
      if (event.type === "set" && selected) {
        const validationError = validateEventDate(selected);
        if (validationError) {
          Alert.alert("Invalid Date", validationError);
        } else {
          setEventDate(selected);
        }
      }
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
    const validationError = validateEventDate(tempPickerDate);
    if (validationError) {
      Alert.alert("Invalid Date", validationError);
      return;
    }
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

  const uploadImageIfAny = async (userId: string): Promise<string | null> => {
    const uri = image?.uri;
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
    setTouched({ title: true, date: true, startTime: true, endTime: true, location: true });
    if (!canSubmit) return;
    setSubmitError(null);
    setStep("preview");
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!canSubmit) {
      setTouched({ title: true, date: true, startTime: true, endTime: true, location: true });
      Alert.alert("Missing info", "Please fill all required fields.");
      return;
    }

    setSubmitError(null);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      Alert.alert("Not signed in", "Please sign in again.");
      setSubmitError("You're signed out. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const filePath = await uploadImageIfAny(user.id);
      if (image && !filePath) {
        Alert.alert("Upload Failed", "Image upload failed. Post not created.");
        setSubmitError("Image upload failed. Please try again or post without a photo.");
        return;
      }

      const finalVisibility = selectedClubId ? visibility : "public";

      // Format event_date as a human-readable string with bullet separator
      // This matches the format expected by parseEventDate in explore.tsx and bulletin.tsx
      // Example: "Mar 14, 2026 • 12:30 PM - 4:20 PM"
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
        user_id: user.id,
        title: eventTitle.trim(),
        description: description.trim() || null,
        image_url: filePath,
        location: eventLocation.trim(),
        event_date: eventDateTimeStr,
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
                <Text style={styles.sectionTitle}>Photo</Text>
                <Text style={styles.sectionHint}>Add one image for your event.</Text>
              </View>
              
              {image ? (
                <View style={styles.singleImageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.singleImagePreview} />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Remove image"
                    onPress={removeImage}
                    style={styles.removeImageButton}
                  >
                    <Feather name="x" size={20} color={colors.surface} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Add image"
                  onPress={pickImage}
                  style={styles.addImageCard}
                >
                  <Feather name="plus" size={22} color={colors.primary} />
                  <Text style={styles.addImageText}>Add Photo</Text>
                </TouchableOpacity>
              )}
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
                      helperText="Must be today or within 2 months"
                      keyboardType="numeric"
                      accessibilityLabel="Date"
                    />
                  ) : (
                    <SelectField
                      label="Date"
                      value={dateLabel}
                      placeholder="MM-DD-YYYY"
                      onPress={openDatePicker}
                      errorText={dateError}
                      rightElement={<Feather name="calendar" size={18} color={colors.textMuted} />}
                    />
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  {isWeb ? (
                    <View>
                      <Text style={styles.inputLabel}>Start Time</Text>
                      <View style={styles.timeInputRow}>
                        <TextInput
                          value={startHour}
                          onChangeText={(v) => {
                            setStartHour(v);
                            setTouched((prev) => ({ ...prev, startTime: true }));
                            updateStartTimeFromWeb(v, startMinute, startAmPm);
                          }}
                          placeholder="HH"
                          keyboardType="numeric"
                          style={styles.timeInputSmall}
                          maxLength={2}
                        />
                        <Text style={styles.timeSeparator}>:</Text>
                        <TextInput
                          value={startMinute}
                          onChangeText={(v) => {
                            setStartMinute(v);
                            setTouched((prev) => ({ ...prev, startTime: true }));
                            updateStartTimeFromWeb(startHour, v, startAmPm);
                          }}
                          placeholder="MM"
                          keyboardType="numeric"
                          style={styles.timeInputSmall}
                          maxLength={2}
                        />
                        <View style={styles.amPmToggle}>
                          <TouchableOpacity
                            style={[styles.amPmButton, startAmPm === "AM" && styles.amPmButtonActive]}
                            onPress={() => {
                              setStartAmPm("AM");
                              updateStartTimeFromWeb(startHour, startMinute, "AM");
                            }}
                          >
                            <Text style={[styles.amPmText, startAmPm === "AM" && styles.amPmTextActive]}>AM</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.amPmButton, startAmPm === "PM" && styles.amPmButtonActive]}
                            onPress={() => {
                              setStartAmPm("PM");
                              updateStartTimeFromWeb(startHour, startMinute, "PM");
                            }}
                          >
                            <Text style={[styles.amPmText, startAmPm === "PM" && styles.amPmTextActive]}>PM</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {startTimeError ? <Text style={styles.errorText}>{startTimeError}</Text> : null}
                    </View>
                  ) : (
                    <SelectField
                      label="Start Time"
                      value={startTimeLabel}
                      placeholder="Select start time"
                      onPress={openStartTimePicker}
                      errorText={startTimeError}
                      rightElement={<Feather name="clock" size={18} color={colors.textMuted} />}
                    />
                  )}
                </View>
                <View style={styles.rowItem}>
                  {isWeb ? (
                    <View>
                      <Text style={styles.inputLabel}>End Time</Text>
                      <View style={styles.timeInputRow}>
                        <TextInput
                          value={endHour}
                          onChangeText={(v) => {
                            setEndHour(v);
                            setTouched((prev) => ({ ...prev, endTime: true }));
                            updateEndTimeFromWeb(v, endMinute, endAmPm);
                          }}
                          placeholder="HH"
                          keyboardType="numeric"
                          style={styles.timeInputSmall}
                          maxLength={2}
                        />
                        <Text style={styles.timeSeparator}>:</Text>
                        <TextInput
                          value={endMinute}
                          onChangeText={(v) => {
                            setEndMinute(v);
                            setTouched((prev) => ({ ...prev, endTime: true }));
                            updateEndTimeFromWeb(endHour, v, endAmPm);
                          }}
                          placeholder="MM"
                          keyboardType="numeric"
                          style={styles.timeInputSmall}
                          maxLength={2}
                        />
                        <View style={styles.amPmToggle}>
                          <TouchableOpacity
                            style={[styles.amPmButton, endAmPm === "AM" && styles.amPmButtonActive]}
                            onPress={() => {
                              setEndAmPm("AM");
                              updateEndTimeFromWeb(endHour, endMinute, "AM");
                            }}
                          >
                            <Text style={[styles.amPmText, endAmPm === "AM" && styles.amPmTextActive]}>AM</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.amPmButton, endAmPm === "PM" && styles.amPmButtonActive]}
                            onPress={() => {
                              setEndAmPm("PM");
                              updateEndTimeFromWeb(endHour, endMinute, "PM");
                            }}
                          >
                            <Text style={[styles.amPmText, endAmPm === "PM" && styles.amPmTextActive]}>PM</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {endTimeError ? <Text style={styles.errorText}>{endTimeError}</Text> : null}
                    </View>
                  ) : (
                    <SelectField
                      label="End Time"
                      value={endTimeLabel}
                      placeholder="Select end time"
                      onPress={openEndTimePicker}
                      errorText={endTimeError}
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

              {/* Move suggestions directly after Location */}
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

              {/* Room Number (optional) */}
              <TextField
                label="Room Number (optional)"
                value={roomNumber}
                onChangeText={setRoomNumber}
                placeholder="Room, suite, or floor (optional)"
                accessibilityLabel="Room Number"
              />

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
              <View style={styles.actionButton}>
                <SecondaryButton title="Cancel" onPress={() => router.back()} />
              </View>
              <View style={styles.actionButton}>
                <SecondaryButton title="Preview" onPress={handlePreview} disabled={!canSubmit} />
              </View>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
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
              <View style={styles.actionButton}>
                <SecondaryButton title="Edit Details" onPress={() => setStep("details")} />
              </View>
              <View style={styles.actionButton}>
                <SecondaryButton title="Post Event" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} />
              </View>
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
            {/* Gray overlay background */}
            <View style={styles.pickerOverlay} />

            <View style={[styles.pickerBackdrop, { backgroundColor: "transparent" }]}>
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Select a date</Text>
                <Text style={styles.pickerSubtitle}>Must be today or within 2 months</Text>
                <DateTimePicker
                  value={tempPickerDate}
                  mode="date"
                  display="inline"
                  minimumDate={getToday()}
                  maximumDate={getMaxDate()}
                  onChange={handleDateChange}
                  themeVariant="light"
                  style={{ height: 350 }}
                />
                <PrimaryButton title="Done" onPress={confirmDate} />
              </View>
            </View>
          </Modal>

          <Modal
            visible={showStartTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowStartTimePicker(false)}
          >
            {/* Gray overlay background */}
            <View style={styles.pickerOverlay} />

            <View style={[styles.pickerBackdrop, { backgroundColor: "transparent" }]}>
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Select start time</Text>
                <DateTimePicker
                  value={tempPickerDate}
                  mode="time"
                  display="spinner"
                  onChange={handleStartTimeChange}
                  themeVariant="light"
                />
                <PrimaryButton title="Done" onPress={confirmStartTime} />
              </View>
            </View>
          </Modal>

          <Modal
            visible={showEndTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowEndTimePicker(false)}
          >
            {/* Gray overlay background */}
            <View style={styles.pickerOverlay} />

            <View style={[styles.pickerBackdrop, { backgroundColor: "transparent" }]}>
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Select end time</Text>
                <Text style={styles.pickerSubtitle}>For overnight events, select a time earlier than start</Text>
                <DateTimePicker
                  value={tempPickerDate}
                  mode="time"
                  display="spinner"
                  onChange={handleEndTimeChange}
                  themeVariant="light"
                />
                <PrimaryButton title="Done" onPress={confirmEndTime} />
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
              display="calendar"
              minimumDate={getToday()}
              maximumDate={getMaxDate()}
              onChange={handleDateChange}
            />
          )}
          {showStartTimePicker && (
            <DateTimePicker
              value={startTime ?? new Date()}
              mode="time"
              display="default"
              onChange={handleStartTimeChange}
            />
          )}
          {showEndTimePicker && (
            <DateTimePicker
              value={endTime ?? new Date()}
              mode="time"
              display="default"
              onChange={handleEndTimeChange}
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
    paddingTop: spacing.huge,
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
  singleImageContainer: {
    position: "relative",
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  singleImagePreview: {
    width: "100%",
    height: 200,
    borderRadius: radii.lg,
  },
  removeImageButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addImageCard: {
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
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
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
  errorText: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
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
  actionButton: {
    flex: 1,
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
  pickerSubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  pickerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});