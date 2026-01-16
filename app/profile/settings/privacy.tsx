import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GradientText from "../../../components/GradientText";
import { supabase } from "../../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../../styles/tokens";

type PrivacySettings = {
  privacy_profile_visible: boolean;
  privacy_show_email: boolean;
  privacy_allow_messages: boolean;
};

const DEFAULT_SETTINGS: PrivacySettings = {
  privacy_profile_visible: true,
  privacy_show_email: false,
  privacy_allow_messages: true,
};

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
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
        setUserId(user.id);

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("privacy_profile_visible, privacy_show_email, privacy_allow_messages")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const row = data ?? {};
        setSettings({
          privacy_profile_visible: row.privacy_profile_visible ?? DEFAULT_SETTINGS.privacy_profile_visible,
          privacy_show_email: row.privacy_show_email ?? DEFAULT_SETTINGS.privacy_show_email,
          privacy_allow_messages: row.privacy_allow_messages ?? DEFAULT_SETTINGS.privacy_allow_messages,
        });
      } catch (err: any) {
        setError(err?.message || "Unable to load privacy settings.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [router]);

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ id: userId, ...next }, { onConflict: "id" });
      if (updateError) throw updateError;
    } catch (err: any) {
      setError(err?.message || "Unable to save changes.");
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              Privacy & Safety
            </GradientText>
            <Text style={styles.subtitle}>Control what others can see.</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <SettingRow
              label="Public profile"
              description="Allow others to see your profile."
              value={settings.privacy_profile_visible}
              onValueChange={(value) => updateSetting("privacy_profile_visible", value)}
              disabled={saving}
            />
            <SettingRow
              label="Show email"
              description="Display your email address on your profile."
              value={settings.privacy_show_email}
              onValueChange={(value) => updateSetting("privacy_show_email", value)}
              disabled={saving}
            />
            <SettingRow
              label="Allow direct messages"
              description="Let people message you from your profile."
              value={settings.privacy_allow_messages}
              onValueChange={(value) => updateSetting("privacy_allow_messages", value)}
              disabled={saving}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

type SettingRowProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

function SettingRow({ label, description, value, onValueChange, disabled }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.borderSoft, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.textSubtle}
      />
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
    paddingBottom: spacing.massive,
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
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    ...shadows.soft,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.lg,
    ...shadows.soft,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  settingText: {
    flex: 1,
    gap: spacing.xs,
  },
  settingLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  settingDescription: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
});
