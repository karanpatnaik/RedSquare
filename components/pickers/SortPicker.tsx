import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radii, spacing, typography } from "../../styles/tokens";
import { SortOption } from "../../types/post";

type SortPickerProps = {
  value: SortOption;
  onChange: (option: SortOption) => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "popular", label: "Most Popular" },
  { value: "ending_soon", label: "Ending Soon" },
  { value: "chronological", label: "Chronological" },
];

export default function SortPicker({ value, onChange }: SortPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value);

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Sort options"
      >
        <Text style={styles.buttonText}>{selectedOption?.label || "Sort"}</Text>
        <Feather name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sort by</Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalItem, value === option.value && styles.modalItemActive]}
                  onPress={() => {
                    onChange(option.value);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={[styles.modalItemText, value === option.value && styles.modalItemTextActive]}>
                    {option.label}
                  </Text>
                  {value === option.value && <Feather name="check" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    height: 44,
  },
  buttonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  modalItemActive: {
    backgroundColor: colors.surfaceTint,
  },
  modalItemText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text,
  },
  modalItemTextActive: {
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
  },
  modalClose: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
  },
});
