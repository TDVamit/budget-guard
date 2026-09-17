import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../app/theme/ThemeProvider';
import { radius, spacing, typography } from '../app/theme/theme';
import { Surface } from './Surface';

export function FormField({
  label,
  style,
  ...inputProps
}: { label: string } & TextInputProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.xs }]}>{label}</Text>
      {/* Inputs are recessed into the panel: you type into the material, not onto it. */}
      <Surface depth="inset" size="control">
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }, style]}
          {...inputProps}
        />
      </Surface>
    </View>
  );
}

export function AmountField({
  value,
  onChangeText,
  label = 'Amount',
  autoFocus,
  editable = true,
}: {
  value: string;
  onChangeText: (v: string) => void;
  label?: string;
  autoFocus?: boolean;
  editable?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.xs }]}>{label}</Text>
      <Surface depth="inset" size="control" style={styles.amountRow}>
        <Text style={[typography.display, { color: colors.textMuted, marginRight: spacing.xs }]}>₹</Text>
        <TextInput
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus}
          editable={editable}
          style={[typography.display, { color: colors.text, flex: 1, padding: 0 }]}
        />
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  input: {
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
