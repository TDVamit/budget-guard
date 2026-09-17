import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../app/theme/ThemeProvider';

/** A minimal horizontal progress bar. Over-budget renders full + warning color, never overflows visually. */
export function BudgetProgress({ spentPaise, accruedPaise }: { spentPaise: number; accruedPaise: number }) {
  const { colors } = useTheme();
  const over = accruedPaise > 0 ? spentPaise > accruedPaise : spentPaise > 0;
  const ratio = accruedPaise > 0 ? Math.min(spentPaise / accruedPaise, 1) : spentPaise > 0 ? 1 : 0;

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.max(ratio * 100, spentPaise !== 0 ? 4 : 0)}%`,
            backgroundColor: over ? colors.negative : colors.text,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
