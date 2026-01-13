import { ReactNode, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors, radii, spacing, typography } from "../../styles/tokens";

type Props = TextInputProps & {
  label: string;
  helperText?: string;
  errorText?: string;
  rightElement?: ReactNode;
};

export default function TextField({
  label,
  helperText,
  errorText,
  rightElement,
  style,
  ...props
}: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          isFocused && styles.inputRowFocused,
          errorText && styles.inputRowError,
        ]}
      >
        <TextInput
          {...props}
          style={[styles.input, style]}
          placeholderTextColor={colors.textSubtle}
          onFocus={(event) => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            props.onBlur?.(event);
          }}
        />
        {rightElement}
      </View>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
      {!errorText && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputRowFocused: {
    borderColor: colors.primary,
  },
  inputRowError: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text,
    paddingVertical: 0,
  },
  helper: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
  },
  error: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.primary,
  },
});
