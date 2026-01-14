import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, radii, spacing, typography } from "../../styles/tokens";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
};

export default function SecondaryButton({
  title,
  onPress,
  disabled,
  loading,
  accessibilityLabel,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.9}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryDark} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.md,
    color: colors.primaryDark,
  },
});
