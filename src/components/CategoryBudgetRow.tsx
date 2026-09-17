import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../app/theme/ThemeProvider';
import { spacing, typography } from '../app/theme/theme';
import { MoneyText } from './MoneyText';
import { BudgetProgress } from './BudgetProgress';

export function CategoryBudgetRow({
  name,
  spentPaise,
  accruedPaise,
}: {
  name: string;
  spentPaise: number;
  accruedPaise: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[typography.body, { color: colors.text }]}>{name}</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          <MoneyText paise={spentPaise} tone="neutral" /> / <MoneyText paise={accruedPaise} tone="neutral" />
        </Text>
      </View>
      <BudgetProgress spentPaise={spentPaise} accruedPaise={accruedPaise} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
