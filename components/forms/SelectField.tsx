import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radii, spacing, typography } from "../../styles/tokens";

type Props = {
  label: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
  errorText?: string;
  rightElement?: ReactNode;
};

export default function SelectField({
  label,
  value,
  placeholder,
  onPress,
  errorText,
  rightElement,
}: Props) {
  const display = value?.trim().length ? value : placeholder ?? "Select";

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.inputRow, errorText && styles.inputRowError]}
      >
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {display}
        </Text>
        {rightElement}
      </TouchableOpacity>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  inputRowError: {
    borderColor: colors.primary,
  },
  value: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text,
  },
  placeholder: {
    color: colors.textSubtle,
  },
  error: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
  },
});
