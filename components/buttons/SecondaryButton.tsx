import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, radii, spacing, typography } from "../../styles/tokens";

type Props = {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

export default function SecondaryButton({ title, onPress, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Text style={styles.buttonText}>{title}</Text>
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
  buttonText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.md,
    color: colors.primaryDark,
  },
});
