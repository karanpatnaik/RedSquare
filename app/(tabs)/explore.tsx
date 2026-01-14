import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GradientText from "../../components/GradientText";
import { supabase } from "../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";

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
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

const formatEventDateTime = (value?: string | null) => {
  if (!value) return "";
  
  // Handle new format: "START_ISO|END_ISO"
  if (value.includes("|")) {
    const [startStr, endStr] = value.split("|");
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : null;
    
    if (Number.isNaN(start.getTime())) return value;
    
    const dateStr = formatDateDisplay(start);
    const startTimeStr = formatTime12Hour(start);
    const endTimeStr = end && !Number.isNaN(end.getTime()) ? formatTime12Hour(end) : "";
    
    return endTimeStr 
      ? `${dateStr} • ${startTimeStr} - ${endTimeStr}`
      : `${dateStr} • ${startTimeStr}`;
  }
  
  // Handle old format with bullet
  if (value.includes("•")) return value;
  
  // Handle plain ISO date
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${formatDateDisplay(parsed)} • ${formatTime12Hour(parsed)}`;
};

const parseEventDate = (value?: string | null) => {
  if (!value) return null;
  
  // Handle new format: "START_ISO|END_ISO"
  if (value.includes("|")) {
    const [startStr] = value.split("|");
    const parsed = new Date(startStr);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  
  // Handle old format
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
type AvatarMap = Record<string, string | null>;

type FilterState = {
  when: "all" | "upcoming" | "past";
  club: "all" | "myClubs";
};

export default function Explore() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userNames, setUserNames] = useState<NameMap>({});
  const [userAvatars, setUserAvatars] = useState<AvatarMap>({});
  const [clubNames, setClubNames] = useState<NameMap>({});
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [userClubIds, setUserClubIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>({ when: "all", club: "all" });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds);
        const nameMap: NameMap = {};
        const avatarMap: AvatarMap = {};
        (profs ?? []).forEach((profile: any) => {
          nameMap[profile.id] = profile.name ?? "User";
          if (profile.avatar_url) {
            const { data: avatarData, error: avatarError } = supabase.storage
              .from("avatars")
              .getPublicUrl(profile.avatar_url);
            avatarMap[profile.id] = avatarError ? null : avatarData?.publicUrl ?? null;
          } else {
            avatarMap[profile.id] = null;
          }
        });
        setUserNames(nameMap);
        setUserAvatars(avatarMap);
      } else {
        setUserNames({});
        setUserAvatars({});
      }

      const clubIds = Array.from(new Set(list.map((post) => post.club_id))).filter(Boolean) as string[];
      if (clubIds.length) {
        const { data: clubs } = await supabase.from("clubs").select("id, name").in("id", clubIds);
        const map: NameMap = {};
        (clubs ?? []).forEach((club: any) => {
          map[club.id] = club.name ?? "Club";
        });
        setClubNames(map);
      } else {
        setClubNames({});
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
        setCurrentUserId(user.id);
        
        const { data: savedRows } = await supabase
          .from("saved_posts")
          .select("post_id")
          .eq("user_id", user.id);
        setSaved(new Set(savedRows?.map((row) => row.post_id) ?? []));

        const { data: memberRows } = await supabase
          .from("club_members")
          .select("club_id")
          .eq("user_id", user.id);
        setUserClubIds(new Set(memberRows?.map((row) => row.club_id) ?? []));
      } else {
        setCurrentUserId(null);
        setSaved(new Set());
        setUserClubIds(new Set());
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

  const filteredPosts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return posts.filter((post) => {
      if (filter.club === "myClubs") {
        if (!post.club_id || !userClubIds.has(post.club_id)) {
          return false;
        }
      }

      if (filter.when === "all") return true;
      const parsed = parseEventDate(post.event_date);
      if (!parsed) return false;
      if (filter.when === "upcoming") return parsed >= today;
      return parsed < today;
    });
  }, [filter, posts, userClubIds]);

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

  const confirmDelete = (post: Post) => {
    setPostToDelete(post);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!postToDelete || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", postToDelete.id);

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postToDelete.id);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      setDeleteModalVisible(false);
      setPostToDelete(null);
      
      Alert.alert("Deleted", "Your post has been deleted.");
    } catch (err: any) {
      console.error("Delete failed:", err);
      Alert.alert("Error", err?.message || "Failed to delete post.");
    } finally {
      setIsDeleting(false);
    }
  };

  const canDeletePost = (post: Post) => {
    return currentUserId === post.user_id;
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
            <Text style={styles.headerSubtitle}>Find what's happening on campus.</Text>
          </View>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>When</Text>
            <View style={styles.filterRow}>
              {(["all", "upcoming", "past"] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterChip, filter.when === option && styles.filterChipActive]}
                  onPress={() => setFilter((prev) => ({ ...prev, when: option }))}
                >
                  <Text style={[styles.filterChipText, filter.when === option && styles.filterChipTextActive]}>
                    {option === "all" ? "All" : option === "upcoming" ? "Upcoming" : "Past"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Club</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, filter.club === "all" && styles.filterChipActive]}
                onPress={() => setFilter((prev) => ({ ...prev, club: "all" }))}
              >
                <Text style={[styles.filterChipText, filter.club === "all" && styles.filterChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, filter.club === "myClubs" && styles.filterChipActive]}
                onPress={() => setFilter((prev) => ({ ...prev, club: "myClubs" }))}
              >
                <Text style={[styles.filterChipText, filter.club === "myClubs" && styles.filterChipTextActive]}>
                  My Clubs
                </Text>
              </TouchableOpacity>
            </View>
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
            <Text style={styles.emptyTitle}>No posts match your filters</Text>
            <Text style={styles.emptyText}>
              {filter.club === "myClubs" 
                ? "You're not a member of any clubs yet, or your clubs haven't posted anything."
                : "Try adjusting your filters to see more events."}
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {filteredPosts.map((post) => {
              const isSaved = saved.has(post.id);
              const who = post.club_id ? clubNames[post.club_id] ?? "Club" : userNames[post.user_id] ?? "User";
              const formattedDate = formatEventDateTime(post.event_date);
              const isOwner = canDeletePost(post);

              return (
                <View key={post.id} style={styles.card}>
                  <View style={styles.cardImageWrapper}>
                    {post.image_url ? (
                      <Image source={{ uri: post.image_url }} style={styles.cardImage} />
                    ) : (
                      <View style={styles.cardImagePlaceholder}>
                        <Feather name="image" size={32} color={colors.textSubtle} />
                        <Text style={styles.placeholderText}>No image</Text>
                      </View>
                    )}
                    <View style={styles.cardOverlay}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{authorName}</Text>
                      </View>
                      <View style={styles.cardActions}>
                        {isOwner && (
                          <TouchableOpacity
                            onPress={() => confirmDelete(post)}
                            style={styles.deleteButton}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel="Delete post"
                          >
                            <Feather name="trash-2" size={14} color={colors.primary} />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => toggleSave(post.id)}
                          style={[styles.savePill, isSaved && styles.savePillActive]}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityLabel={isSaved ? "Remove from saved" : "Save event"}
                        >
                          <Feather name="heart" size={14} color={isSaved ? colors.surface : colors.primary} />
                          <Text style={[styles.savePillText, isSaved && styles.savePillTextActive]}>
                            {isSaved ? "Saved" : "Save"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{post.title || "(untitled)"}</Text>
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

      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Post</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{postToDelete?.title || "this post"}"? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => { setDeleteModalVisible(false); setPostToDelete(null); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteButton} onPress={handleDelete} disabled={isDeleting}>
                <Text style={styles.modalDeleteText}>{isDeleting ? "Deleting..." : "Delete"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingTop: spacing.xxxl, paddingHorizontal: spacing.xl, paddingBottom: spacing.massive, gap: spacing.xxl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  logo: { width: 88, height: 88, resizeMode: "contain" },
  headerText: { flex: 1 },
  headerSubtitle: { marginTop: spacing.xs, fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, color: colors.textMuted },
  filterCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.soft, gap: spacing.md },
  filterSection: { gap: spacing.sm },
  filterLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, color: colors.text },
  filterRow: { flexDirection: "row", gap: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.borderSoft },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium, color: colors.chipText },
  filterChipTextActive: { color: colors.surface },
  skeletonList: { gap: spacing.lg },
  skeletonCard: { borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, overflow: "hidden" },
  skeletonImage: { height: 180, backgroundColor: colors.surfaceTint },
  skeletonContent: { padding: spacing.lg, gap: spacing.sm },
  skeletonLineLarge: { height: 16, width: "70%", backgroundColor: colors.surfaceTint, borderRadius: radii.sm },
  skeletonLine: { height: 12, width: "50%", backgroundColor: colors.surfaceTint, borderRadius: radii.sm },
  emptyState: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: typography.sizes.md, fontFamily: typography.fonts.semibold, color: colors.text },
  emptyText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, color: colors.textMuted, textAlign: "center" },
  cardList: { gap: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.borderSoft, overflow: "hidden", ...shadows.soft },
  cardImageWrapper: { position: "relative" },
  cardImage: { width: "100%", height: 200 },
  cardImagePlaceholder: { height: 200, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTint, gap: spacing.xs },
  placeholderText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, color: colors.textSubtle },
  cardOverlay: { position: "absolute", top: spacing.md, left: spacing.md, right: spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radii.pill },
  badgeText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.medium, color: colors.primaryDark },
  cardActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  deleteButton: { width: 32, height: 32, borderRadius: radii.pill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.primary },
  savePill: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  savePillActive: { backgroundColor: colors.primary },
  savePillText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold, color: colors.primary },
  savePillTextActive: { color: colors.surface },
  cardContent: { padding: spacing.lg, gap: spacing.sm },
  cardTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.semibold, color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaText: { flex: 1, fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, color: colors.textMuted },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center" },
  modalCard: { width: "88%", maxWidth: 400, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.soft },
  modalTitle: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.semibold, color: colors.text, marginBottom: spacing.sm },
  modalMessage: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, color: colors.textMuted, lineHeight: typography.lineHeights.lg, marginBottom: spacing.lg },
  modalActions: { flexDirection: "row", gap: spacing.md },
  modalCancelButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderSoft, alignItems: "center" },
  modalCancelText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, color: colors.textMuted },
  modalDeleteButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: colors.primary, alignItems: "center" },
  modalDeleteText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, color: colors.surface },
});
