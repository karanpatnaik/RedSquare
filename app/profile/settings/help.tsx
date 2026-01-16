import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GradientText from "../../../components/GradientText";
import { colors, radii, spacing, typography } from "../../../styles/tokens";

const SUPPORT_EMAIL = "support@redsquare.app";
const SUPPORT_URL = "https://redsquare.app/support";
const PRIVACY_URL = "https://redsquare.app/privacy";
const TERMS_URL = "https://redsquare.app/terms";

export default function HelpSupport() {
  const router = useRouter();

  const openLink = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
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
              Help & Support
            </GradientText>
            <Text style={styles.subtitle}>We’re here if you need us.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}
            accessibilityRole="button"
            accessibilityLabel="Email support"
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <Feather name="mail" size={18} color={colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.rowTitle}>Email support</Text>
                <Text style={styles.rowSubtitle}>{SUPPORT_EMAIL}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLink(SUPPORT_URL)}
            accessibilityRole="button"
            accessibilityLabel="Open help center"
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <Feather name="help-circle" size={18} color={colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.rowTitle}>Help center</Text>
                <Text style={styles.rowSubtitle}>FAQs and troubleshooting</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLink(PRIVACY_URL)}
            accessibilityRole="button"
            accessibilityLabel="Open privacy policy"
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <Feather name="shield" size={18} color={colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.rowTitle}>Privacy policy</Text>
                <Text style={styles.rowSubtitle}>How we handle your data</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLink(TERMS_URL)}
            accessibilityRole="button"
            accessibilityLabel="Open terms of service"
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <Feather name="file-text" size={18} color={colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.rowTitle}>Terms of service</Text>
                <Text style={styles.rowSubtitle}>Community rules and guidelines</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
});
