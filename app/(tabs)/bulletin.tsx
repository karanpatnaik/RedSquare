import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import GradientText from "../../components/GradientText";
import { supabase } from "../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";
import { Post } from "../../types/post";

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
  const parts = value.split("•").map((p) => p.trim());
  if (parts.length < 2) {
    const guess = new Date(parts[0]);
    return Number.isNaN(guess.getTime()) ? null : guess;
  }
  const timePart = parts[1].split(" - ")[0].trim();
  const guess = new Date(`${parts[0]} ${timePart}`);
  if (Number.isNaN(guess.getTime())) return null;
  return guess;
};

type NameMap = Record<string, string>;

export default function Bulletin() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [userNames, setUserNames] = useState<NameMap>({});
  const [clubNames, setClubNames] = useState<NameMap>({});

  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);
  const [confirmDeleteImagePath, setConfirmDeleteImagePath] = useState<string | null>(null);

  const loadSaved = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setSavedPosts([]);
        return;
      }

      const userId = authData.user.id;

      // Get saved post ids
      const { data: savedRows, error: savedErr } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", userId);

      if (savedErr) throw savedErr;

      const ids = (savedRows ?? []).map((r: any) => r.post_id).filter(Boolean);
      if (ids.length === 0) {
        setSavedPosts([]);
        return;
      }

      // Pull posts
      const { data: postsData, error: postsErr } = await supabase
        .from("posts")
        .select("*")
        .in("id", ids);

      if (postsErr) throw postsErr;

      const list = (postsData ?? []) as Post[];

      // Map names
      const userIds = Array.from(new Set(list.map((p) => p.user_id))).filter(Boolean);
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, name").in("id", userIds);
        const map: NameMap = {};
        (profs ?? []).forEach((profile: any) => {
          map[profile.id] = profile.name ?? "User";
        });
        setUserNames(map);
      }

      const clubIds = Array.from(new Set(list.map((p) => p.club_id))).filter(Boolean) as string[];
      if (clubIds.length) {
        const { data: clubs } = await supabase.from("clubs").select("id, name").in("id", clubIds);
        const map: NameMap = {};
        (clubs ?? []).forEach((club: any) => {
          map[club.id] = club.name ?? "Club";
        });
        setClubNames(map);
      }

      // Add public URLs for images, and keep raw path for delete (image_path)
      const withImages = list.map((post) => {
        if (!post.image_url) return post;
        const path = post.image_url; // raw path in bucket
        const { data } = supabase.storage.from("post-images").getPublicUrl(path);
        return { ...post, image_url: data?.publicUrl ?? null, image_path: path } as any;
      });

      setSavedPosts(withImages);
    } catch (err) {
      console.warn("Load saved error:", err);
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

  const performDeletePost = async (postId: string, imagePath: string | null) => {
    setDeletingPostId(postId);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error("You must be signed in to delete posts.");
      }

      const userId = authData.user.id;

      // Delete related data first
      await supabase.from("saved_posts").delete().eq("post_id", postId);
      await supabase.from("rsvps").delete().eq("post_id", postId);
      await supabase.from("reactions").delete().eq("post_id", postId);

      // Delete the post
      const { error: deleteError, data: deletedRows } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", userId)
        .select();

      if (deleteError) throw deleteError;

      if (!deletedRows || deletedRows.length === 0) {
        throw new Error("Delete failed (no rows deleted). This is likely an RLS/ownership issue.");
      }

      // Delete image from storage if exists
      if (imagePath) {
        await supabase.storage.from("post-images").remove([imagePath]);
      }

      // Remove from local state
      setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      console.error("Delete failed:", err);
      loadSaved(); // Reload to sync state
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleDeletePost = (postId: string, imagePath: string | null) => {
    setConfirmDeletePostId(postId);
    setConfirmDeleteImagePath(imagePath);
  };

  const featuredPost = useMemo(() => {
    if (savedPosts.length === 0) return null;
    // pick nearest upcoming; fallback first
    const now = new Date();
    const upcoming = savedPosts
      .map((p) => ({ p, d: parseEventDate(p.event_date) }))
      .filter((x) => x.d && x.d >= now)
      .sort((a, b) => (a.d!.getTime() - b.d!.getTime()))[0];
    return (upcoming?.p ?? savedPosts[0]) as any;
  }, [savedPosts]);

  const otherPosts = useMemo(() => {
    if (!featuredPost) return savedPosts;
    return savedPosts.filter((p) => p.id !== featuredPost.id);
  }, [savedPosts, featuredPost]);

  return (
    <View style={styles.screen}>
      {/* Delete confirmation modal (works on web + native) */}
      <Modal
        visible={!!confirmDeletePostId}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeletePostId(null)}
      >
        <View style={styles.deleteModalBackdrop}>
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>Delete post?</Text>
            <Text style={styles.deleteModalBody}>
              This will permanently remove your post from everywhere (not just your saved list). This cannot be undone.
            </Text>

            <View style={styles.deleteModalActions}>
              <Pressable
                onPress={() => {
                  setConfirmDeletePostId(null);
                  setConfirmDeleteImagePath(null);
                }}
                style={({ pressed }) => [
                  styles.deleteModalButton,
                  styles.deleteModalCancel,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  const id = confirmDeletePostId;
                  const img = confirmDeleteImagePath;
                  setConfirmDeletePostId(null);
                  setConfirmDeleteImagePath(null);
                  if (id) {
                    await performDeletePost(id, img);
                  }
                }}
                style={({ pressed }) => [
                  styles.deleteModalButton,
                  styles.deleteModalDelete,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.deleteModalDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
          <GradientText fontFamily={typography.fonts.medium} fontSize={typography.sizes.display}>
            Saved
          </GradientText>
          <Text style={styles.headerSubtitle}>Your saved events and posts.</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : savedPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="bookmark" size={32} color={colors.textSubtle} />
            <Text style={styles.emptyTitle}>No saved posts.</Text>
            <Text style={styles.emptyText}>Tap “Save” on an event to add it here.</Text>
          </View>
        ) : (
          <>
            {featuredPost ? (
              <View style={styles.featuredCard}>
                <View style={styles.featuredImageWrapper}>
                  {featuredPost.image_url ? (
                    <Image source={{ uri: featuredPost.image_url }} style={styles.featuredImage} />
                  ) : (
                    <View style={styles.featuredImagePlaceholder}>
                      <Feather name="image" size={28} color={colors.textSubtle} />
                      <Text style={styles.placeholderText}>No image</Text>
                    </View>
                  )}
                </View>

                <View style={styles.featuredContent}>
                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {featuredPost.title || "(untitled)"}
                  </Text>

                  <Text style={styles.featuredMeta}>
                    {featuredPost.club_id
                      ? clubNames[featuredPost.club_id] ?? "Club"
                      : userNames[featuredPost.user_id] ?? "User"}
                  </Text>

                  {featuredPost.event_date ? (
                    <View style={styles.metaRow}>
                      <Feather name="clock" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{formatEventDateTime(featuredPost.event_date)}</Text>
                    </View>
                  ) : null}

                  {featuredPost.location ? (
                    <View style={styles.metaRow}>
                      <Feather name="map-pin" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{featuredPost.location}</Text>
                    </View>
                  ) : null}

                  {/* Delete (only for your own posts) */}
                  {featuredPost.user_id ? (
                    <View style={styles.featuredActions}>
                      <Pressable
                        onPressIn={(e) => {
                          // @ts-ignore
                          e?.stopPropagation?.();
                        }}
                        onPress={(e) => {
                          // @ts-ignore
                          e?.stopPropagation?.();
                          handleDeletePost(featuredPost.id, (featuredPost as any).image_path ?? null);
                        }}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          deletingPostId === featuredPost.id && styles.deleteButtonDisabled,
                          pressed && { opacity: 0.75 },
                        ]}
                        accessibilityLabel="Delete your post"
                        disabled={deletingPostId === featuredPost.id}
                      >
                        {deletingPostId === featuredPost.id ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <Feather name="trash-2" size={14} color={colors.primary} />
                            <Text style={styles.deleteButtonText}>Delete</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            <View style={styles.list}>
              {otherPosts.map((post: any) => {
                const who = post.club_id ? clubNames[post.club_id] ?? "Club" : userNames[post.user_id] ?? "User";
                const isDeleting = deletingPostId === post.id;

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
                      </View>
                    </View>

                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {post.title || "(untitled)"}
                      </Text>

                      {post.event_date ? (
                        <View style={styles.metaRow}>
                          <Feather name="clock" size={14} color={colors.textMuted} />
                          <Text style={styles.metaText}>{formatEventDateTime(post.event_date)}</Text>
                        </View>
                      ) : null}

                      {post.location ? (
                        <View style={styles.metaRow}>
                          <Feather name="map-pin" size={14} color={colors.textMuted} />
                          <Text style={styles.metaText}>{post.location}</Text>
                        </View>
                      ) : null}

                      <Pressable
                        onPressIn={(e) => {
                          // @ts-ignore
                          e?.stopPropagation?.();
                        }}
                        onPress={(e) => {
                          // @ts-ignore
                          e?.stopPropagation?.();
                          handleDeletePost(post.id, post.image_path ?? null);
                        }}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          isDeleting && styles.deleteButtonDisabled,
                          pressed && { opacity: 0.75 },
                        ]}
                        disabled={isDeleting}
                        accessibilityLabel="Delete your post"
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <Feather name="trash-2" size={14} color={colors.primary} />
                            <Text style={styles.deleteButtonText}>Delete</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
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
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.massive,
    gap: spacing.xxl,
  },
  header: {
    gap: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    ...shadows.soft,
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

  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    ...shadows.soft,
  },
  featuredImageWrapper: { position: "relative" },
  featuredImage: { width: "100%", height: 220 },
  featuredImagePlaceholder: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTint,
    gap: spacing.xs,
  },
  featuredContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  featuredTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  featuredMeta: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.textMuted,
  },
  featuredActions: {
    marginTop: spacing.sm,
    flexDirection: "row",
  },

  list: { gap: spacing.lg },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    ...shadows.soft,
  },
  cardImageWrapper: { position: "relative" },
  cardImage: { width: "100%", height: 200 },
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

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    minWidth: 80,
    minHeight: 32,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },

  // Delete modal
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  deleteModalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.soft,
  },
  deleteModalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  deleteModalBody: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  deleteModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  deleteModalButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalCancel: {
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  deleteModalCancelText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
  },
  deleteModalDelete: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  deleteModalDeleteText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.surface,
  },
});
