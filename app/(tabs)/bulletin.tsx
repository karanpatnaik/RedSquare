import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GradientText from "../../components/GradientText";
import { supabase } from "../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";

const parseEventDate = (value?: string | null) => {
  if (!value) return null;
  const parts = value.split("•").map((part) => part.trim());
  const guess = parts.length > 1 ? new Date(`${parts[0]} ${parts[1]}`) : new Date(parts[0]);
  if (Number.isNaN(guess.getTime())) return null;
  return guess;
};

type SavedPostRow = {
  post_id: string;
  posts: {
    id: string;
    user_id: string;
    club_id: string | null;
    title: string | null;
    description: string | null;
    image_url: string | null;
    location: string | null;
    event_date: string | null;
    created_at: string | null;
  };
};

type FlatPost = {
  id: string;
  title: string | null;
  image_url: string | null;
  location: string | null;
  date: string | null;
  time?: string | null;
};

export default function Bulletin() {
  const [savedPosts, setSavedPosts] = useState<FlatPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  const loadSaved = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        setSavedPosts([]);
        return;
      }

      const { data, error } = await supabase
        .from("saved_posts")
        .select("post_id, posts(*)")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (error) throw error;

      const flat: FlatPost[] = ((data ?? []) as unknown as SavedPostRow[]).map((row) => {
        const post = row.posts;
        const { data: urlData } = post.image_url
          ? supabase.storage.from("post-images").getPublicUrl(post.image_url)
          : { data: { publicUrl: null } };

        return {
          id: post.id,
          title: post.title,
          image_url: urlData?.publicUrl ?? null,
          location: post.location,
          date: post.event_date,
          time: null,
        };
      });

      setSavedPosts(flat);
    } catch (err) {
      console.warn("Failed to load saved posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSaved();
    setRefreshing(false);
  };

  const filteredPosts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return savedPosts.filter((post) => {
      if (filter === "all") return true;
      const parsed = parseEventDate(post.date);
      if (!parsed) return false;
      if (filter === "upcoming") return parsed >= today;
      return parsed < today;
    });
  }, [filter, savedPosts]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      const dateA = parseEventDate(a.date);
      const dateB = parseEventDate(b.date);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });
  }, [filteredPosts]);

  const featuredPost = sortedPosts[0] ?? null;
  const remainingPosts = sortedPosts.slice(1);

  const unsave = async (postId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const afterRemove = savedPosts.filter((post) => post.id !== postId);
    setSavedPosts(afterRemove);

    try {
      await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);
    } catch (err) {
      console.warn("Unsave failed:", err);
      loadSaved();
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Image source={require("../../assets/images/rslogo.png")} style={styles.logo} />
          <View style={styles.headerText}>
            <GradientText fontFamily={typography.fonts.medium} fontSize={typography.sizes.display}>
              Bulletin
            </GradientText>
            <Text style={styles.subtitle}>Your saved events and campus highlights.</Text>
          </View>
          <View style={styles.savedCountPill}>
            <Text style={styles.savedCountText}>{savedPosts.length} saved</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {(["upcoming", "all", "past"] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.filterChip, filter === option && styles.filterChipActive]}
              onPress={() => setFilter(option)}
            >
              <Text style={[styles.filterText, filter === option && styles.filterTextActive]}>
                {option === "upcoming" ? "Upcoming" : option === "past" ? "Past" : "All"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Next up</Text>
          {featuredPost ? (
            <View style={styles.heroContent}>
              {featuredPost.image_url ? (
                <Image source={{ uri: featuredPost.image_url }} style={styles.heroImage} />
              ) : (
                <View style={styles.heroImagePlaceholder}>
                  <Feather name="image" size={28} color={colors.textSubtle} />
                  <Text style={styles.heroPlaceholderText}>No image</Text>
                </View>
              )}
              <View style={styles.heroDetails}>
                <Text style={styles.heroTitle}>{featuredPost.title ?? "(untitled)"}</Text>
                {featuredPost.date ? (
                  <View style={styles.heroMeta}>
                    <Feather name="clock" size={14} color={colors.textMuted} />
                    <Text style={styles.heroMetaText}>{featuredPost.date}</Text>
                  </View>
                ) : null}
                {featuredPost.location ? (
                  <View style={styles.heroMeta}>
                    <Feather name="map-pin" size={14} color={colors.textMuted} />
                    <Text style={styles.heroMetaText}>{featuredPost.location}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={styles.unsaveButton}
                  onPress={() => unsave(featuredPost.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove from saved"
                >
                  <Feather name="heart" size={14} color={colors.surface} />
                  <Text style={styles.unsaveText}>Saved</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.heroEmpty}>
              <Text style={styles.heroEmptyText}>{loading ? "Loading saved posts…" : "No saved posts yet."}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Events</Text>
          <Text style={styles.sectionSubtitle}>{remainingPosts.length} more saved</Text>
        </View>

        {remainingPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="bookmark" size={28} color={colors.textSubtle} />
            <Text style={styles.emptyTitle}>Your bulletin is empty.</Text>
            <Text style={styles.emptyText}>Save events from Explore to build your list.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {remainingPosts.map((post) => (
              <View key={post.id} style={styles.listCard}>
                {post.image_url ? (
                  <Image source={{ uri: post.image_url }} style={styles.listImage} />
                ) : (
                  <View style={styles.listImagePlaceholder}>
                    <Feather name="image" size={18} color={colors.textSubtle} />
                  </View>
                )}
                <View style={styles.listContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {post.title ?? "(untitled)"}
                  </Text>
                  <Text style={styles.listMeta} numberOfLines={1}>
                    {post.date || "Date TBA"}
                  </Text>
                  {post.location ? (
                    <Text style={styles.listMeta} numberOfLines={1}>
                      {post.location}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Unsave post"
                  style={styles.listAction}
                  onPress={() => unsave(post.id)}
                >
                  <Feather name="heart" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.massive,
    gap: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  logo: {
    width: 88,
    height: 88,
    resizeMode: "contain",
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  savedCountPill: {
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  savedCountText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.primaryDark,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.chipText,
  },
  filterTextActive: {
    color: colors.surface,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
    gap: spacing.md,
  },
  heroLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.primaryDark,
  },
  heroContent: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  heroImage: {
    width: 140,
    height: 140,
    borderRadius: radii.lg,
  },
  heroImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  heroPlaceholderText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textSubtle,
  },
  heroDetails: {
    flex: 1,
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroMetaText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  heroEmpty: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  heroEmptyText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  unsaveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },
  unsaveText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.surface,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  list: {
    gap: spacing.lg,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.soft,
  },
  listImage: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
  },
  listImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    flex: 1,
    gap: spacing.xs,
  },
  listTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  listMeta: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  listAction: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTint,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    textAlign: "center",
  },
});
