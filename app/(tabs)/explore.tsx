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
import EventDetailModal from "../../components/modals/EventDetailModal";
import SortPicker from "../../components/pickers/SortPicker";
import SearchBar from "../../components/search/SearchBar";
import { supabase } from "../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";
import { Post, SortOption } from "../../types/post";

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

// Post type is now imported from types/post.ts

type NameMap = Record<string, string>;
type AvatarMap = Record<string, string | null>;

type FilterState = {
  when: "all" | "upcoming" | "past";
  club: "all" | "myClubs";
};

const PAGE_SIZE = 20;

export default function Explore() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastCursor, setLastCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [userNames, setUserNames] = useState<NameMap>({});
  const [userAvatars, setUserAvatars] = useState<AvatarMap>({});
  const [clubNames, setClubNames] = useState<NameMap>({});
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<Set<string>>(new Set());
  const [followedClubs, setFollowedClubs] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterState>({ when: "all", club: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // Fetch all posts (RLS policies will handle access control)
      // Note: rsvp_count and reaction_count are optional - default to 0 if not present
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        console.warn("Supabase query error:", error);
        throw error;
      }
      console.log("Posts fetched:", postsData?.length ?? 0, "posts", postsData);
      const list = (postsData ?? []) as Post[];

      // Set pagination cursor
      setLastCursor(list.length > 0 ? list[list.length - 1].created_at : null);
      setHasMore(list.length === PAGE_SIZE);

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
        // Fetch all user interactions in parallel
        const [savedData, rsvpData, reactionData, followedData] = await Promise.all([
          supabase.from("saved_posts").select("post_id").eq("user_id", user.id),
          supabase.from("rsvps").select("post_id").eq("user_id", user.id),
          supabase.from("reactions").select("post_id").eq("user_id", user.id),
          supabase.from("followed_clubs").select("club_id").eq("user_id", user.id),
        ]);

        setSaved(new Set(savedData.data?.map((row) => row.post_id) ?? []));
        setRsvps(new Set(rsvpData.data?.map((row) => row.post_id) ?? []));
        setReactions(new Set(reactionData.data?.map((row) => row.post_id) ?? []));
        setFollowedClubs(new Set(followedData.data?.map((row) => row.club_id) ?? []));
      } else {
        setCurrentUserId(null);
        setSaved(new Set());
        setRsvps(new Set());
        setReactions(new Set());
        setFollowedClubs(new Set());
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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || !lastCursor) return;

    setLoadingMore(true);
    try {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .lt("created_at", lastCursor)
        .limit(PAGE_SIZE);

      if (error) throw error;
      const list = (postsData ?? []) as Post[];

      setLastCursor(list.length > 0 ? list[list.length - 1].created_at : null);
      setHasMore(list.length === PAGE_SIZE);

      // Process images for new posts
      const postsWithImages = list.map((post) => {
        if (!post.image_url) return post;
        const { data } = supabase.storage.from("post-images").getPublicUrl(post.image_url);
        return { ...post, image_url: data?.publicUrl ?? null };
      });

      setPosts([...posts, ...postsWithImages]);
    } catch (err) {
      console.warn("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleRSVP = async (postId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const next = new Set(rsvps);
    const wasRSVPed = next.has(postId);

    // Optimistic update
    if (wasRSVPed) {
      next.delete(postId);
    } else {
      next.add(postId);
    }
    setRsvps(next);

    try {
      if (wasRSVPed) {
        await supabase.from("rsvps").delete().eq("user_id", auth.user.id).eq("post_id", postId);
      } else {
        await supabase.from("rsvps").insert({ user_id: auth.user.id, post_id: postId });
      }
      // Update local post counts optimistically
      setPosts(posts.map(p => p.id === postId ? { ...p, rsvp_count: wasRSVPed ? Math.max(0, (p.rsvp_count || 0) - 1) : (p.rsvp_count || 0) + 1 } : p));
    } catch (err) {
      setRsvps(new Set(rsvps)); // rollback
      console.warn("RSVP toggle failed:", err);
    }
  };

  const toggleReaction = async (postId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const next = new Set(reactions);
    const wasLiked = next.has(postId);

    // Optimistic update
    if (wasLiked) {
      next.delete(postId);
    } else {
      next.add(postId);
    }
    setReactions(next);

    try {
      if (wasLiked) {
        await supabase.from("reactions").delete().eq("user_id", auth.user.id).eq("post_id", postId);
      } else {
        await supabase.from("reactions").insert({ user_id: auth.user.id, post_id: postId });
      }
      // Update local post counts optimistically
      setPosts(posts.map(p => p.id === postId ? { ...p, reaction_count: wasLiked ? Math.max(0, (p.reaction_count || 0) - 1) : (p.reaction_count || 0) + 1 } : p));
    } catch (err) {
      setReactions(new Set(reactions)); // rollback
      console.warn("Reaction toggle failed:", err);
    }
  };

  const toggleFollowClub = async (clubId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const next = new Set(followedClubs);
    const wasFollowing = next.has(clubId);

    // Optimistic update
    if (wasFollowing) {
      next.delete(clubId);
    } else {
      next.add(clubId);
    }
    setFollowedClubs(next);

    try {
      if (wasFollowing) {
        await supabase.from("followed_clubs").delete().eq("user_id", auth.user.id).eq("club_id", clubId);
      } else {
        await supabase.from("followed_clubs").insert({ user_id: auth.user.id, club_id: clubId });
      }
    } catch (err) {
      setFollowedClubs(new Set(followedClubs)); // rollback
      console.warn("Follow toggle failed:", err);
    }
  };

  const clubOptions = useMemo(() => {
    const entries = Object.entries(clubNames).map(([id, name]) => ({ id, name }));
    return [{ id: "all", name: "All Clubs" }, ...entries];
  }, [clubNames]);

  const filteredPosts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return posts.filter((post) => {
      // Club filter
      const matchClub = filter.club === "all" || post.club_id === filter.club;
      if (!matchClub) return false;

      // Date filter - posts without parseable dates show in "all" and "upcoming" but not "past"
      if (filter.when !== "all") {
        const parsed = parseEventDate(post.event_date);
        if (!parsed) {
          // Show posts without dates in "upcoming" (they might be TBA), hide in "past"
          if (filter.when === "past") return false;
        } else {
          if (filter.when === "upcoming" && parsed < today) return false;
          if (filter.when === "past" && parsed >= today) return false;
        }
      }

      // Search filter
      if (debouncedQuery.trim()) {
        const q = debouncedQuery.toLowerCase();
        const matchTitle = post.title?.toLowerCase().includes(q);
        const matchDesc = post.description?.toLowerCase().includes(q);
        const matchLoc = post.location?.toLowerCase().includes(q);
        const matchClubName = post.club_id && clubNames[post.club_id]?.toLowerCase().includes(q);

        if (!matchTitle && !matchDesc && !matchLoc && !matchClubName) {
          return false;
        }
      }

      return true;
    });
  }, [filter, posts, debouncedQuery, clubNames]);

  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts];

    switch (sortBy) {
      case "popular":
        return sorted.sort((a, b) => {
          const scoreA = (a.rsvp_count || 0) + (a.reaction_count || 0);
          const scoreB = (b.rsvp_count || 0) + (b.reaction_count || 0);
          return scoreB - scoreA;
        });

      case "ending_soon":
      case "chronological":
        return sorted.sort((a, b) => {
          const dateA = parseEventDate(a.event_date);
          const dateB = parseEventDate(b.event_date);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA.getTime() - dateB.getTime();
        });

      case "recent":
      default:
        return sorted.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
    }
  }, [filteredPosts, sortBy]);

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

  const renderItem = ({ item: post }: { item: Post }) => {
    const who = post.club_id ? clubNames[post.club_id] ?? "Club" : userNames[post.user_id] ?? "User";
    const isSaved = saved.has(post.id);
    const formattedDate = formatEventDateTime(post.event_date);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          setSelectedPost(post);
          setModalVisible(true);
        }}
      >
        <View style={styles.card}>
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
                <Feather name={isSaved ? "heart" : "heart"} size={14} color={isSaved ? colors.surface : colors.primary} />
                <Text style={[styles.savePillText, isSaved && styles.savePillTextActive]}>{isSaved ? "Saved" : "Save"}</Text>
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
      </TouchableOpacity>
    );
  };

  const ListHeaderComponent = (
    <>
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

      <View style={styles.toolbarRow}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder="Search events, clubs, locations..."
          />
        </View>
        <SortPicker value={sortBy} onChange={setSortBy} />
      </View>
    </>
  );

  const ListEmptyComponent = loading ? (
    <View style={styles.skeletonList}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={`skeleton-${index}`}>{renderSkeleton()}</View>
      ))}
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Feather name="calendar" size={32} color={colors.textSubtle} />
      <Text style={styles.emptyTitle}>No posts match your filters.</Text>
      <Text style={styles.emptyText}>Try adjusting the date or club filters.</Text>
    </View>
  );

  const ListFooterComponent = loadingMore ? (
    <View style={styles.loadingMore}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  ) : null;

  return (
    <View style={styles.screen}>
      <FlatList
        data={sortedPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      <EventDetailModal
        visible={modalVisible}
        post={selectedPost}
        onClose={() => setModalVisible(false)}
        onToggleSave={() => selectedPost && toggleSave(selectedPost.id)}
        onToggleRSVP={() => selectedPost && toggleRSVP(selectedPost.id)}
        onToggleLike={() => selectedPost && toggleReaction(selectedPost.id)}
        onFollowClub={() => selectedPost?.club_id && toggleFollowClub(selectedPost.club_id)}
        isSaved={selectedPost ? saved.has(selectedPost.id) : false}
        isRSVPed={selectedPost ? rsvps.has(selectedPost.id) : false}
        isLiked={selectedPost ? reactions.has(selectedPost.id) : false}
        isFollowingClub={selectedPost?.club_id ? followedClubs.has(selectedPost.club_id) : false}
        clubName={selectedPost?.club_id ? clubNames[selectedPost.club_id] : undefined}
        organizerName={selectedPost ? userNames[selectedPost.user_id] : undefined}
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
    minWidth: 72,
    justifyContent: "center",
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
  toolbarRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
  },
  loadingMore: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
});
