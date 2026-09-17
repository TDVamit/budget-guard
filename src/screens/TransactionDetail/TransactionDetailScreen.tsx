import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { spacing, typography } from '../../app/theme/theme';
import { Screen } from '../../components/Screen';
import { Surface, PressableSurface } from '../../components/Surface';
import { Entrance } from '../../app/motion/animations';
import { Button } from '../../components/Button';
import { MoneyText } from '../../components/MoneyText';
import { Icon, categoryIconFor } from '../../components/Icon';
import { useBudgetStore } from '../../store/budgetStore';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionDetail'>;

export function TransactionDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const transaction = useBudgetStore((s) => s.transactions.find((t) => t.id === route.params.transactionId));
  const categories = useBudgetStore((s) => s.categories);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const [busy, setBusy] = useState(false);

  if (!transaction) {
    return (
      <Screen>
        <Text style={{ color: colors.textMuted }}>Transaction not found.</Text>
      </Screen>
    );
  }

  const transactionId = transaction.id;
  // Money arriving mid-cycle is always a one-off, whatever its source.
  const isIncome = transaction.type === 'INCOME' && transaction.direction === 'CREDIT';
  const destination = transaction.incomeDestination ?? 'BUDGET';

  async function setDestination(incomeDestination: 'BUDGET' | 'SAVINGS') {
    setBusy(true);
    try {
      await updateTransaction(transactionId, { incomeDestination });
    } finally {
      setBusy(false);
    }
  }

  async function recategorise(categoryId: string) {
    setBusy(true);
    try {
      await updateTransaction(transactionId, { categoryId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <MoneyText
        paise={transaction.direction === 'DEBIT' ? -transaction.amountPaise : transaction.amountPaise}
        style={[typography.display, { fontSize: 40 }]}
        tone={transaction.direction === 'DEBIT' ? 'negative' : 'positive'}
      />
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
        {format(transaction.timestamp, 'EEEE, d MMM yyyy · h:mm a')}
      </Text>

      <Entrance index={0}>
      <Surface size="card" style={styles.card}>
        {/* Auto-detected names come from notification text and are often clumsy,
            so renaming is the first thing offered rather than buried in Edit. */}
        <DetailRow
          label="Name"
          value={transaction.merchant || 'Tap to name'}
          muted={!transaction.merchant}
          onPress={() => navigation.navigate('AddTransaction', { transactionId })}
        />
        <DetailRow
          label="Type"
          value={isIncome ? 'One-time income' : transaction.type.replace(/_/g, ' ')}
        />
        <DetailRow label="Source" value={transaction.source.replace(/_/g, ' ')} />
        {!transaction.autoConfirmed ? <DetailRow label="Status" value="Needs review" /> : null}
      </Surface>
      </Entrance>

      {isIncome && (
        <>
          <Text style={[typography.title, { fontSize: 15, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
            Where this money goes
          </Text>
          <View style={styles.chipWrap}>
            {([
              { value: 'BUDGET' as const, label: 'Spendable budget', hint: 'Adds to Others' },
              { value: 'SAVINGS' as const, label: 'Savings', hint: 'Kept aside' },
            ]).map((option) => {
              const selected = destination === option.value;
              return (
                <PressableSurface
                  key={option.value}
                  onPress={() => (selected ? undefined : setDestination(option.value))}
                  depth={selected ? 'raised' : 'inset'}
                  size="pill"
                  disabled={busy}
                  accessibilityLabel={option.label}
                  style={[styles.chip, selected && { backgroundColor: colors.accent }]}
                >
                  <Text
                    style={[
                      typography.body,
                      { color: selected ? colors.onAccent : colors.text, fontWeight: selected ? '700' : '500' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </PressableSurface>
              );
            })}
          </View>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
            {destination === 'BUDGET'
              ? 'Raises what you can spend this cycle.'
              : 'Held out of the daily allowance.'}
          </Text>
        </>
      )}

      {/* One tap re-files the transaction — no edit screen, no save step. */}
      <Text style={[typography.title, { fontSize: 15, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        Category
      </Text>
      <View style={styles.chipWrap}>
        {categories.map((c) => {
          const selected = c.id === transaction.categoryId;
          return (
            // The category the transaction sits in is raised; the rest are recessed.
            <PressableSurface
              key={c.id}
              onPress={() => (selected ? undefined : recategorise(c.id))}
              depth={selected ? 'raised' : 'inset'}
              size="pill"
              disabled={busy}
              accessibilityLabel={`Move to ${c.name}`}
              style={[styles.chip, selected && { backgroundColor: colors.accent }]}
            >
              <Icon name={categoryIconFor(c.name)} size={14} color={selected ? colors.onAccent : colors.text} />
              <Text
                style={[
                  typography.body,
                  { color: selected ? colors.onAccent : colors.text, marginLeft: 6, fontWeight: selected ? '700' : '500' },
                ]}
              >
                {c.name}
              </Text>
            </PressableSurface>
          );
        })}
      </View>

      <View style={{ height: spacing.lg }} />
      <Button title="Edit details" variant="secondary" onPress={() => navigation.navigate('AddTransaction', { transactionId })} />
    </Screen>
  );
}

function DetailRow({
  label,
  value,
  onPress,
  muted,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  muted?: boolean;
}) {
  const { colors } = useTheme();
  const body = (
    <>
      <Text style={[typography.body, { color: colors.textMuted }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
        <Text
          style={[typography.body, { color: muted ? colors.textMuted : colors.text, textAlign: 'right' }]}
          numberOfLines={2}
        >
          {value}
        </Text>
        {onPress ? (
          <View style={{ marginLeft: 4 }}>
            <Icon name="chevron-right" size={14} color={colors.textMuted} />
          </View>
        ) : null}
      </View>
    </>
  );

  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
