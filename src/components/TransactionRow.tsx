import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '../app/theme/ThemeProvider';
import { spacing, typography } from '../app/theme/theme';
import { MoneyText } from './MoneyText';
import type { Transaction } from '../models/types';

export function TransactionRow({
  transaction,
  categoryName,
  onPress,
}: {
  transaction: Transaction;
  categoryName: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const isOutflow = transaction.direction === 'DEBIT';
  const title = transaction.merchant || transaction.note || categoryName;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [styles.row, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.left}>
        <Text style={[typography.body, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
          {categoryName} · {format(transaction.timestamp, 'd MMM, h:mm a')}
          {!transaction.autoConfirmed ? ' · Needs review' : ''}
        </Text>
      </View>
      <MoneyText
        paise={isOutflow ? -transaction.amountPaise : transaction.amountPaise}
        tone={isOutflow ? 'negative' : 'positive'}
        style={typography.body}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flex: 1,
    marginRight: spacing.md,
  },
});
