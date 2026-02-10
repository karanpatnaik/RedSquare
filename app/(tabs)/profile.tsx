import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientText from "../../components/GradientText";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import { supabase } from "../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";

type ProfileRow = {
  id: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  net_id: string | null;
};

const CONTENT = [
  { id: "posts", label: "Manage posts", icon: "edit-3", route: "/profile/posts" },
];

const SETTINGS = [
  { id: "account", label: "Account details", icon: "user", route: "/profile/settings/account" },
  {
    id: "notifications",
    label: "Notification preferences",
    icon: "bell",
    route: "/profile/settings/notifications",
  },
  { id: "privacy", label: "Privacy & safety", icon: "shield", route: "/profile/settings/privacy" },
  { id: "help", label: "Help & support", icon: "help-circle", route: "/profile/settings/help" },
];

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [metaName, setMetaName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState({ posts: 0, saved: 0, clubs: 0 });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;

      setEmail(user?.email ?? null);
      setMetaName((user?.user_metadata?.name as string) ?? null);

      if (!user) {
        setProfile(null);
        setAvatarUrl(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, bio, avatar_url, net_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const row: ProfileRow = data ?? {
        id: user.id,
        name: null,
        bio: null,
        avatar_url: null,
        net_id: null,
      };

      setProfile(row);

      if (row.avatar_url) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(row.avatar_url);
        setAvatarUrl(urlData?.publicUrl ?? null);
      } else {
        setAvatarUrl(null);
      }

      const [postsRes, savedRes, clubsRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase
          .from("saved_posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("club_members")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      setActivity({
        posts: postsRes.count ?? 0,
        saved: savedRes.count ?? 0,
        clubs: clubsRes.count ?? 0,
      });

      // Activity count errors are non-critical, continue silently
    } catch (err: any) {
      setError(err?.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const displayName = useMemo(() => {
    const profileName = profile?.name?.trim();
    if (profileName) return profileName;
    if (metaName) return metaName;
    return "Georgetown User";
  }, [metaName, profile?.name]);

  const displayEmail = useMemo(() => {
    if (email) return email;
    const netId = profile?.net_id?.trim();
    if (netId) return `${netId}@georgetown.edu`;
    return "";
  }, [email, profile?.net_id]);

  const hasBio = !!profile?.bio?.trim();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <GradientText fontFamily={typography.fonts.medium} fontSize={typography.sizes.display}>
              Profile
            </GradientText>
            <Text style={styles.subtitle}>Manage your account and preferences.</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            onPress={() => router.push("/profile/edit")}
            style={styles.editButton}
          >
            <Feather name="edit-2" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.card}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Edit avatar"
                onPress={() => router.push("/profile/edit")}
                style={styles.avatar}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Feather name="user" size={28} color={colors.primary} />
                )}
              </TouchableOpacity>
              <View style={styles.cardText}>
                <Text style={styles.name}>{displayName}</Text>
                {displayEmail ? <Text style={styles.caption}>{displayEmail}</Text> : null}
              </View>
            </View>

            <SecondaryButton title="Edit profile" onPress={() => router.push("/profile/edit")} />

            <View style={styles.bioCard}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={[styles.bioText, !hasBio && styles.bioPlaceholder]}>
                {hasBio ? profile?.bio : "Add a short bio so people know who you are."}
              </Text>
            </View>

            <View style={styles.activityCard}>
              <Text style={styles.sectionTitle}>Activity</Text>
              <View style={styles.activityRow}>
                <View style={styles.activityItem}>
                  <Text style={styles.activityValue}>{activity.posts}</Text>
                  <Text style={styles.activityLabel}>Posts</Text>
                </View>
                <View style={styles.activityItem}>
                  <Text style={styles.activityValue}>{activity.saved}</Text>
                  <Text style={styles.activityLabel}>Saved</Text>
                </View>
                <View style={styles.activityItem}>
                  <Text style={styles.activityValue}>{activity.clubs}</Text>
                  <Text style={styles.activityLabel}>Clubs</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your content</Text>
              {CONTENT.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.settingRow}
                  activeOpacity={0.8}
                  onPress={() => router.push(item.route)}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <Feather name={item.icon as any} size={18} color={colors.primaryDark} />
                    </View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              {SETTINGS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.settingRow}
                  activeOpacity={0.8}
                  onPress={() => router.push(item.route)}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <Feather name={item.icon as any} size={18} color={colors.primaryDark} />
                    </View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.signOutButton} activeOpacity={0.85} onPress={handleSignOut}>
              <Feather name="log-out" size={16} color={colors.primary} />
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.massive,
    gap: spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  editButton: {
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
  errorText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
  },
  avatar: {
    width: 64,
    height: 64,
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
  cardText: {
    gap: spacing.xs,
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  caption: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  bioCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.sm,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.md,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  activityValue: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  activityLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.textMuted,
  },
  bioText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text,
    lineHeight: typography.lineHeights.lg,
  },
  bioPlaceholder: {
    color: colors.textMuted,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.text,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  signOutText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },
});
