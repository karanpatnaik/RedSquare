import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import GradientText from "../../components/GradientText";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";

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

const formatEventDateTime = (value?: string | null) => {
  if (!value) return "";
  if (value.includes("•")) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${formatDate(parsed)} • ${formatTime(parsed)}`;
};

const parseEventDate = (value?: string | null) => {
  if (!value) return null;
  const parts = value.split("•").map((part) => part.trim());
  const guess = parts.length > 1 ? new Date(`${parts[0]} ${parts[1]}`) : new Date(parts[0]);
  if (Number.isNaN(guess.getTime())) return null;
  return guess;
};

type Post = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  location: string | null;
  event_date: string | null;
  created_at: string | null;
  user_id: string;
  club_id: string | null;
};

type NameMap = Record<string, string>;

type FilterState = {
  when: "all" | "upcoming" | "past";
  club: "all" | string;
};

export default function Explore() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userNames, setUserNames] = useState<NameMap>({});
  const [clubNames, setClubNames] = useState<NameMap>({});
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterState>({ when: "all", club: "all" });

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("id, title, description, image_url, location, event_date, created_at, user_id, club_id")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const list = (postsData ?? []) as Post[];

      const userIds = Array.from(new Set(list.map((post) => post.user_id))).filter(Boolean);
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, name").in("id", userIds);
        const map: NameMap = {};
        (profs ?? []).forEach((profile: any) => {
          map[profile.id] = profile.name ?? "User";
        });
        setUserNames(map);
      }

      const clubIds = Array.from(new Set(list.map((post) => post.club_id))).filter(Boolean) as string[];
      if (clubIds.length) {
        const { data: clubs } = await supabase.from("clubs").select("id, name").in("id", clubIds);
        const map: NameMap = {};
        (clubs ?? []).forEach((club: any) => {
          map[club.id] = club.name ?? "Club";
        });
        setClubNames(map);
      }

      const postsWithImages = list.map((post) => {
        if (!post.image_url) return post;
        const { data } = supabase.storage.from("post-images").getPublicUrl(post.image_url);
        return { ...post, image_url: data?.publicUrl ?? null };
      });
      setPosts(postsWithImages);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (user) {
        const { data: savedRows } = await supabase
          .from("saved_posts")
          .select("post_id")
          .eq("user_id", user.id);
        setSaved(new Set(savedRows?.map((row) => row.post_id) ?? []));
      } else {
        setSaved(new Set());
      }
    } catch (err) {
      console.warn("Feed load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const clubOptions = useMemo(() => {
    const entries = Object.entries(clubNames).map(([id, name]) => ({ id, name }));
    return [{ id: "all", name: "All Clubs" }, ...entries];
  }, [clubNames]);

  const filteredPosts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return posts.filter((post) => {
      const matchClub = filter.club === "all" || post.club_id === filter.club;
      if (!matchClub) return false;

      if (filter.when === "all") return true;
      const parsed = parseEventDate(post.event_date);
      if (!parsed) return false;
      if (filter.when === "upcoming") return parsed >= today;
      return parsed < today;
    });
  }, [filter, posts]);

  const toggleSave = async (postId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const next = new Set(saved);
    const wasSaved = next.has(postId);
    try {
      if (wasSaved) {
        next.delete(postId);
        setSaved(next);
        await supabase.from("saved_posts").delete().eq("user_id", user.id).eq("post_id", postId);
      } else {
        next.add(postId);
        setSaved(next);
        await supabase.from("saved_posts").insert({ user_id: user.id, post_id: postId });
      }
    } catch (err) {
      setSaved(new Set(saved));
      console.warn("Save toggle failed:", err);
    }
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLineLarge} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLine} />
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={require("../../assets/images/rslogo.png")} style={styles.logo} />
          <View style={styles.headerText}>
            <GradientText fontFamily={typography.fonts.medium} fontSize={typography.sizes.display}>
              Explore
            </GradientText>
            <Text style={styles.headerSubtitle}>Find what’s happening on campus.</Text>
          </View>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>When</Text>
            <View style={styles.filterRow}>
              {(["all", "upcoming", "past"] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterChip,
                    filter.when === option && styles.filterChipActive,
                  ]}
                  onPress={() => setFilter((prev) => ({ ...prev, when: option }))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filter.when === option && styles.filterChipTextActive,
                    ]}
                  >
                    {option === "all" ? "All" : option === "upcoming" ? "Upcoming" : "Past"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Club</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {clubOptions.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  style={[
                    styles.filterChip,
                    filter.club === club.id && styles.filterChipActive,
                  ]}
                  onPress={() => setFilter((prev) => ({ ...prev, club: club.id }))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filter.club === club.id && styles.filterChipTextActive,
                    ]}
                  >
                    {club.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {loading ? (
          <View style={styles.skeletonList}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={`skeleton-${index}`}>{renderSkeleton()}</View>
            ))}
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={32} color={colors.textSubtle} />
            <Text style={styles.emptyTitle}>No posts match your filters.</Text>
            <Text style={styles.emptyText}>Try adjusting the date or club filters.</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {filteredPosts.map((post) => {
              const who = post.club_id
                ? clubNames[post.club_id] ?? "Club"
                : userNames[post.user_id] ?? "User";
              const isSaved = saved.has(post.id);

              const formattedDate = formatEventDateTime(post.event_date);

              return (
                <View key={post.id} style={styles.card}>
                  <View style={styles.cardImageWrapper}>
                    {post.image_url ? (
                      <Image source={{ uri: post.image_url }} style={styles.cardImage} />
                    ) : (
                      <View style={styles.cardImagePlaceholder}>
                        <Feather name="image" size={28} color={colors.textSubtle} />
                        <Text style={styles.placeholderText}>No image</Text>
                      </View>
                    )}
                    <View style={styles.cardOverlay}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{who}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleSave(post.id)}
                        style={[styles.savePill, isSaved && styles.savePillActive]}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={isSaved ? "Remove from saved" : "Save event"}
                      >
                        <Feather
                          name={isSaved ? "heart" : "heart"}
                          size={14}
                          color={isSaved ? colors.surface : colors.primary}
                        />
                        <Text style={[styles.savePillText, isSaved && styles.savePillTextActive]}>
                          {isSaved ? "Saved" : "Save"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {post.title || "(untitled)"}
                    </Text>
                    {formattedDate ? (
                      <View style={styles.metaRow}>
                        <Feather name="clock" size={14} color={colors.textMuted} />
                        <Text style={styles.metaText}>{formattedDate}</Text>
                      </View>
                    ) : null}
                    {post.location ? (
                      <View style={styles.metaRow}>
                        <Feather name="map-pin" size={14} color={colors.textMuted} />
                        <Text style={styles.metaText}>{post.location}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
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
    paddingTop: spacing.xxxl,
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
  headerSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
    gap: spacing.md,
  },
  filterSection: {
    gap: spacing.sm,
  },
  filterLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
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
  filterChipText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.chipText,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  skeletonList: {
    gap: spacing.lg,
  },
  skeletonCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
  },
  skeletonImage: {
    height: 180,
    backgroundColor: colors.surfaceTint,
  },
  skeletonContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  skeletonLineLarge: {
    height: 16,
    width: "70%",
    backgroundColor: colors.surfaceTint,
    borderRadius: radii.sm,
  },
  skeletonLine: {
    height: 12,
    width: "50%",
    backgroundColor: colors.surfaceTint,
    borderRadius: radii.sm,
  },
  emptyState: {
    alignItems: "center",
    padding: spacing.xxl,
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
  cardList: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    ...shadows.soft,
  },
  cardImageWrapper: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 200,
  },
  cardImagePlaceholder: {
    height: 200,
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
  cardOverlay: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.primaryDark,
  },
  savePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  savePillActive: {
    backgroundColor: colors.primary,
  },
  savePillText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },
  savePillTextActive: {
    color: colors.surface,
  },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
});
