import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../app/theme/ThemeProvider';
import { spacing, typography } from '../app/theme/theme';

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[typography.body, { color: colors.text, fontWeight: '500' }]}>{title}</Text>
      {subtitle ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
