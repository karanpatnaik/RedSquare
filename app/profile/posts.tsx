import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GradientText from "../../components/GradientText";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import { supabase } from "../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";

type PostRow = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  location: string | null;
  event_date: string | null;
  created_at: string | null;
  visibility: "public" | "private" | null;
};

type PostItem = PostRow & {
  image_public_url: string | null;
};

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

export default function ProfilePosts() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
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
        .select("id, title, description, image_url, location, event_date, created_at, visibility")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (postError) throw postError;

      const list = (data ?? []) as PostRow[];
      const withImages = list.map((post) => {
        if (!post.image_url) return { ...post, image_public_url: null };
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(post.image_url);
        return { ...post, image_public_url: urlData?.publicUrl ?? null };
      });
      setPosts(withImages);
    } catch (err: any) {
      setError(err?.message || "Unable to load your posts.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const handleDelete = (postId: string) => {
    Alert.alert("Delete post?", "This will permanently remove the post.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) return;

            const current = posts.find((post) => post.id === postId);
            setPosts((prev) => prev.filter((post) => post.id !== postId));

            await supabase.from("saved_posts").delete().eq("post_id", postId);

            const { error: deleteError } = await supabase
              .from("posts")
              .delete()
              .eq("id", postId)
              .eq("user_id", user.id);

            if (deleteError) throw deleteError;

            if (current?.image_url) {
              await supabase.storage.from("post-images").remove([current.image_url]);
            }
          } catch (err: any) {
            setError(err?.message || "Unable to delete the post.");
            loadPosts();
          }
        },
      },
    ]);
  };

  const postCountLabel = useMemo(
    () => (posts.length === 1 ? "1 post" : `${posts.length} posts`),
    [posts.length]
  );

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
              Your Posts
            </GradientText>
            <Text style={styles.subtitle}>{postCountLabel}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Create a new post"
            onPress={() => router.push("/createPost")}
            style={styles.newButton}
          >
            <Feather name="plus" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {posts.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="edit-3" size={32} color={colors.textSubtle} />
                <Text style={styles.emptyTitle}>No posts yet.</Text>
                <Text style={styles.emptyText}>Create your first post to share it with campus.</Text>
                <PrimaryButton title="Create post" onPress={() => router.push("/createPost")} />
              </View>
            ) : (
              <View style={styles.postList}>
                {posts.map((post) => (
                  <View key={post.id} style={styles.postCard}>
                    {post.image_public_url ? (
                      <Image source={{ uri: post.image_public_url }} style={styles.postImage} />
                    ) : (
                      <View style={styles.postImagePlaceholder}>
                        <Feather name="image" size={20} color={colors.textSubtle} />
                        <Text style={styles.placeholderText}>No image</Text>
                      </View>
                    )}
                    <View style={styles.postContent}>
                      <View style={styles.postHeader}>
                        <Text style={styles.postTitle} numberOfLines={2}>
                          {post.title || "(untitled)"}
                        </Text>
                        <View style={styles.visibilityPill}>
                          <Text style={styles.visibilityText}>{post.visibility ?? "public"}</Text>
                        </View>
                      </View>
                      {post.event_date ? (
                        <Text style={styles.postMeta}>{formatEventDateTime(post.event_date)}</Text>
                      ) : null}
                      {post.location ? <Text style={styles.postMeta}>{post.location}</Text> : null}
                      <View style={styles.postActions}>
                        <SecondaryButton title="Edit" onPress={() => router.push(`/profile/posts/${post.id}`)} />
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Delete post"
                          onPress={() => handleDelete(post.id)}
                          style={styles.deleteButton}
                        >
                          <Feather name="trash-2" size={16} color={colors.primary} />
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
  newButton: {
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
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    gap: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
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
  postList: {
    gap: spacing.lg,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: "hidden",
    ...shadows.soft,
  },
  postImage: {
    width: "100%",
    height: 180,
  },
  postImagePlaceholder: {
    height: 180,
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
  postContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  postTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  visibilityPill: {
    backgroundColor: colors.surfaceTint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  visibilityText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.primaryDark,
  },
  postMeta: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  deleteButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },
});
