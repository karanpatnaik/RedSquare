import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Image, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { colors, radii, shadows, spacing, typography } from "../../styles/tokens";
import { Post } from "../../types/post";

type EventDetailModalProps = {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onToggleSave: () => void;
  onToggleRSVP: () => void;
  onToggleLike: () => void;
  onFollowClub?: () => void;
  isSaved: boolean;
  isRSVPed: boolean;
  isLiked: boolean;
  isFollowingClub?: boolean;
  clubName?: string;
  organizerName?: string;
};

export default function EventDetailModal({
  visible,
  post,
  onClose,
  onToggleSave,
  onToggleRSVP,
  onToggleLike,
  onFollowClub,
  isSaved,
  isRSVPed,
  isLiked,
  isFollowingClub,
  clubName,
  organizerName,
}: EventDetailModalProps) {
  const [isReporting, setIsReporting] = useState(false);

  if (!post) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${post.title}\n\n${post.description || ""}\n\n📅 ${post.event_date || "Date TBA"}\n📍 ${post.location || "Location TBA"}`,
        title: post.title || "Georgetown Event",
      });
    } catch (err) {
      console.warn("Share failed:", err);
    }
  };

  const handleReport = async () => {
    if (isReporting) return;

    setIsReporting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert report into database
      const { error } = await supabase.from("reports").insert({
        post_id: post.id,
        post_title: post.title || "Untitled",
        post_description: post.description || null,
        post_location: post.location || null,
        post_event_date: post.event_date || null,
        post_user_id: post.user_id,
        post_club_id: post.club_id || null,
        post_created_at: post.created_at,
        post_image_url: post.image_url || null,
        reported_by: user?.id || null,
        reported_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Report submission failed:", error);
        Alert.alert("Error", "Failed to submit report. Please try again.");
      } else {
        Alert.alert(
          "Report Submitted",
          "We got your report. Someone from our team is taking a look."
        );
      }
    } catch (err) {
      console.warn("Report failed:", err);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setIsReporting(false);
    }
  };

  const organizer = clubName || organizerName || "User";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {post.image_url ? (
              <Image source={{ uri: post.image_url }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroImagePlaceholder}>
                <Feather name="image" size={48} color={colors.textSubtle} />
                <Text style={styles.placeholderText}>No image</Text>
              </View>
            )}

            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>{post.title || "(untitled)"}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{organizer}</Text>
                </View>
              </View>

              {post.event_date && (
                <View style={styles.metaRow}>
                  <Feather name="clock" size={18} color={colors.primary} />
                  <Text style={styles.metaText}>{post.event_date}</Text>
                </View>
              )}

              {post.location && (
                <View style={styles.metaRow}>
                  <Feather name="map-pin" size={18} color={colors.primary} />
                  <Text style={styles.metaText}>{post.location}</Text>
                </View>
              )}

              {post.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionLabel}>Description</Text>
                  <Text style={styles.description}>{post.description}</Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Feather name="users" size={16} color={colors.textMuted} />
                  <Text style={styles.statText}>{post.rsvp_count || 0} RSVPs</Text>
                </View>
                <View style={styles.stat}>
                  <Feather name="heart" size={16} color={colors.textMuted} />
                  <Text style={styles.statText}>{post.reaction_count || 0} Likes</Text>
                </View>
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, isSaved && styles.actionButtonSaved]}
                  onPress={onToggleSave}
                  accessibilityRole="button"
                  accessibilityLabel={isSaved ? "Remove from saved" : "Save event"}
                >
                  <Feather name="bookmark" size={18} color={isSaved ? colors.surface : colors.primary} />
                  <Text style={[styles.actionButtonText, isSaved && styles.actionButtonTextActive]}>
                    {isSaved ? "Saved" : "Save"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, isRSVPed && styles.actionButtonRSVP]}
                  onPress={onToggleRSVP}
                  accessibilityRole="button"
                  accessibilityLabel={isRSVPed ? "Cancel RSVP" : "RSVP to event"}
                >
                  <Feather name="check-circle" size={18} color={isRSVPed ? colors.surface : colors.primary} />
                  <Text style={[styles.actionButtonText, isRSVPed && styles.actionButtonTextActive]}>
                    {isRSVPed ? "RSVP'd" : "RSVP"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, isLiked && styles.actionButtonLiked]}
                  onPress={onToggleLike}
                  accessibilityRole="button"
                  accessibilityLabel={isLiked ? "Unlike" : "Like event"}
                >
                  <Feather name="heart" size={18} color={isLiked ? colors.surface : colors.primary} />
                  <Text style={[styles.actionButtonText, isLiked && styles.actionButtonTextActive]}>
                    {isLiked ? "Liked" : "Like"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShare}
                  accessibilityRole="button"
                  accessibilityLabel="Share event"
                >
                  <Feather name="share-2" size={18} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButtonReport, isReporting && styles.actionButtonDisabled]}
                  onPress={handleReport}
                  disabled={isReporting}
                  accessibilityRole="button"
                  accessibilityLabel="Report post"
                >
                  <Feather name="flag" size={18} color={colors.textMuted} />
                  <Text style={styles.actionButtonTextReport}>
                    {isReporting ? "Reporting..." : "Report"}
                  </Text>
                </TouchableOpacity>
              </View>

              {post.club_id && onFollowClub && (
                <TouchableOpacity
                  style={[styles.followButton, isFollowingClub && styles.followButtonActive]}
                  onPress={onFollowClub}
                  accessibilityRole="button"
                  accessibilityLabel={isFollowingClub ? `Unfollow ${clubName}` : `Follow ${clubName}`}
                >
                  <Feather name={isFollowingClub ? "check" : "plus"} size={16} color={isFollowingClub ? colors.primary : colors.surface} />
                  <Text style={[styles.followButtonText, isFollowingClub && styles.followButtonTextActive]}>
                    {isFollowingClub ? `Following ${clubName}` : `Follow ${clubName}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: "90%",
    ...shadows.medium,
  },
  closeButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: spacing.sm,
    ...shadows.soft,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  heroImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  heroImagePlaceholder: {
    width: "100%",
    height: 300,
    backgroundColor: colors.surfaceTint,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  placeholderText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.textSubtle,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
    color: colors.text,
    lineHeight: typography.lineHeights.xxl,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.primaryDark,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  metaText: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.medium,
    color: colors.text,
  },
  descriptionSection: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text,
    lineHeight: typography.lineHeights.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.textMuted,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    minWidth: 90,
    justifyContent: "center",
  },
  actionButtonSaved: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  actionButtonRSVP: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonLiked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },
  actionButtonTextActive: {
    color: colors.surface,
  },
  actionButtonReport: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    minWidth: 90,
    justifyContent: "center",
  },
  actionButtonTextReport: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  followButtonActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.surface,
  },
  followButtonTextActive: {
    color: colors.primary,
  },
});
