import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../app/theme/ThemeProvider';
import { spacing, typography } from '../app/theme/theme';

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 0.5 }]}>{title.toUpperCase()}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});
