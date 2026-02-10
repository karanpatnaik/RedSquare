import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientText from "../../components/GradientText";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import TextField from "../../components/forms/TextField";
import { supabase } from "../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";

type ProfileRow = {
  id: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  net_id: string | null;
};

const BIO_MAX = 160;

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [netId, setNetId] = useState<string | null>(null);

  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [touched, setTouched] = useState({ name: false });

  const nameError = useMemo(() => {
    if (!touched.name) return "";
    if (!name.trim()) return "Name is required.";
    if (name.trim().length < 2) return "Use at least 2 characters.";
    return "";
  }, [name, touched.name]);

  const canSave = name.trim().length >= 2;

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const user = authData?.user;
        if (!user) {
          Alert.alert("Not signed in", "Please sign in again.");
          router.replace("/");
          return;
        }

        setEmail(user.email ?? null);
        const derivedNetId = user.email ? user.email.split("@")[0] : null;
        setNetId(derivedNetId);

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, bio, avatar_url, net_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const row: ProfileRow = data ?? {
          id: user.id,
          name: (user.user_metadata?.name as string) ?? null,
          bio: null,
          avatar_url: null,
          net_id: derivedNetId,
        };

        setName(row.name ?? "");
        setBio(row.bio ?? "");
        setAvatarPath(row.avatar_url ?? null);
        setRemoveAvatar(false);
        setPendingAvatarUri(null);

        if (row.avatar_url) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(row.avatar_url);
          setAvatarPreview(urlData?.publicUrl ?? null);
        } else {
          setAvatarPreview(null);
        }

        setNetId(row.net_id ?? derivedNetId);
      } catch (err: any) {
        setError(err?.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      if (!permission.canAskAgain) {
        Alert.alert(
          "Permission needed",
          "Please enable photo access in settings to upload an avatar.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert("Permission needed", "Allow photo access to upload an avatar.");
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setPendingAvatarUri(asset.uri);
    setAvatarPreview(asset.uri);
    setRemoveAvatar(false);
  };

  const handleRemoveAvatar = () => {
    setPendingAvatarUri(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
  };

  const uploadAvatar = async (userId: string, uri: string) => {
    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error(`Failed to read image (${res.status})`);
    }
    const blob = await res.blob();
    const filePath = `${userId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (uploadError) throw uploadError;
    return filePath;
  };

  const handleSave = async () => {
    if (saving) return;
    setTouched({ name: true });
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

      let nextAvatarPath = avatarPath;
      if (removeAvatar) nextAvatarPath = null;
      if (pendingAvatarUri) {
        nextAvatarPath = await uploadAvatar(user.id, pendingAvatarUri);
      }

      const updates = {
        id: user.id,
        name: name.trim(),
        bio: bio.trim() || null,
        avatar_url: nextAvatarPath,
        net_id: netId ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase.from("profiles").upsert(updates, {
        onConflict: "id",
      });
      if (updateError) throw updateError;

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { name: name.trim() },
      });
      // Auth metadata update is non-critical if profile update succeeded

      if ((removeAvatar || pendingAvatarUri) && avatarPath && avatarPath !== nextAvatarPath) {
        await supabase.storage.from("avatars").remove([avatarPath]);
      }

      Alert.alert("Saved", "Your profile has been updated.");
      router.back();
    } catch (err: any) {
      setError(err?.message || "Unable to save profile.");
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
        keyboardShouldPersistTaps="handled"
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
              Edit Profile
            </GradientText>
            <Text style={styles.subtitle}>Keep your info fresh for the community.</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            {avatarPreview ? (
              <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />
            ) : (
              <Feather name="user" size={28} color={colors.primary} />
            )}
          </View>
          <View style={styles.avatarActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change avatar"
              onPress={handlePickAvatar}
              style={styles.avatarButton}
            >
              <Feather name="image" size={16} color={colors.primaryDark} />
              <Text style={styles.avatarButtonText}>Change photo</Text>
            </TouchableOpacity>
            {avatarPreview ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Remove avatar"
                onPress={handleRemoveAvatar}
                style={styles.avatarRemoveButton}
              >
                <Feather name="x" size={16} color={colors.textMuted} />
                <Text style={styles.avatarRemoveText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.formCard}>
          <TextField
            label="Full Name"
            value={name}
            onChangeText={setName}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            placeholder="Enter your name"
            autoCapitalize="words"
            textContentType="name"
            autoComplete="name"
            returnKeyType="next"
            errorText={nameError}
            accessibilityLabel="Full Name"
          />

          <View style={styles.bioField}>
            <Text style={styles.bioLabel}>Bio</Text>
            <View style={styles.bioInputWrap}>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Add a short bio about yourself"
                placeholderTextColor={colors.textSubtle}
                multiline
                maxLength={BIO_MAX}
                textAlignVertical="top"
                style={styles.bioInput}
                accessibilityLabel="Bio"
              />
            </View>
            <Text style={styles.bioCount}>{bio.length}/{BIO_MAX}</Text>
          </View>

          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{email ?? "Not available"}</Text>
          </View>
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>NetID</Text>
            <Text style={styles.readOnlyValue}>{netId ?? "Not available"}</Text>
          </View>
        </View>

        <PrimaryButton
          title="Save changes"
          onPress={handleSave}
          loading={saving}
          disabled={!canSave}
        />
        <SecondaryButton title="Cancel" onPress={() => router.back()} />
      </ScrollView>
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
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarActions: {
    flex: 1,
    gap: spacing.sm,
  },
  avatarButton: {
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
  avatarButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primaryDark,
  },
  avatarRemoveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  avatarRemoveText: {
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
  bioField: {
    marginBottom: spacing.lg,
  },
  bioLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bioInputWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bioInput: {
    minHeight: 96,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text,
  },
  bioCount: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    textAlign: "right",
  },
  readOnlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  readOnlyLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.text,
  },
  readOnlyValue: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
});
