import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { radius, spacing, typography } from '../../app/theme/theme';
import { AmountField, FormField } from '../../components/FormField';
import { Button } from '../../components/Button';
import { Icon, categoryIconFor } from '../../components/Icon';
import { useBudgetStore } from '../../store/budgetStore';
import { OTHERS_CATEGORY_NAME } from '../../models/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;
type Direction = 'expense' | 'income';

export function AddTransactionScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const categories = useBudgetStore((s) => s.categories);
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const deleteTransaction = useBudgetStore((s) => s.deleteTransaction);
  const transactions = useBudgetStore((s) => s.transactions);

  const editing = route.params?.transactionId
    ? transactions.find((t) => t.id === route.params?.transactionId)
    : undefined;
  const canEditDetectedIncome = !!editing && editing.type === 'INCOME' && editing.direction === 'CREDIT' && editing.source !== 'MANUAL';

  const othersCategory = useMemo(() => categories.find((c) => c.name === OTHERS_CATEGORY_NAME), [categories]);

  const [direction, setDirection] = useState<Direction>(editing?.direction === 'CREDIT' ? 'income' : 'expense');
  const [amount, setAmount] = useState(editing ? String(editing.amountPaise / 100) : '');
  const [categoryId, setCategoryId] = useState(editing?.categoryId || othersCategory?.id || '');
  const [merchant, setMerchant] = useState(editing?.merchant || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!categoryId && othersCategory) setCategoryId(othersCategory.id);
  }, [othersCategory, categoryId]);

  const amountPaise = Math.round(parseFloat(amount || '0') * 100);
  const canSave = amountPaise > 0 && (direction === 'income' || !!categoryId);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      if (editing) {
        await updateTransaction(editing.id, {
          ...(canEditDetectedIncome ? { amountPaise } : {}),
          categoryId: direction === 'income' ? othersCategory?.id ?? categoryId : categoryId,
          merchant: merchant || undefined,
          ...(canEditDetectedIncome ? {
            direction: direction === 'income' ? 'CREDIT' as const : 'DEBIT' as const,
            type: direction === 'income' ? 'INCOME' as const : 'VARIABLE_EXPENSE' as const,
          } : {}),
        });
      } else {
        await addTransaction({
          amountPaise,
          direction: direction === 'income' ? 'CREDIT' : 'DEBIT',
          type: direction === 'income' ? 'INCOME' : 'VARIABLE_EXPENSE',
          categoryId: direction === 'income' ? othersCategory?.id ?? categoryId : categoryId,
          merchant: merchant || undefined,
          source: 'MANUAL',
          timestamp: Date.now(),
          confidence: 1,
          autoConfirmed: true,
        });
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    await deleteTransaction(editing.id);
    // This screen is opened from TransactionDetail. Pop both screens so the
    // deleted transaction detail is never left visible with a stale id.
    navigation.pop(2);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        {(!editing || canEditDetectedIncome) && <View style={[styles.toggle, { backgroundColor: colors.surfaceAlt }]}> 
          <Pressable
            onPress={() => setDirection('expense')}
            hitSlop={4}
            style={[styles.toggleBtn, direction === 'expense' && { backgroundColor: colors.accent }]}
          >
            <Text style={[typography.label, { color: direction === 'expense' ? colors.onAccent : colors.text }]}>Expense</Text>
          </Pressable>
          <Pressable
            onPress={() => setDirection('income')}
            hitSlop={4}
            style={[styles.toggleBtn, direction === 'income' && { backgroundColor: colors.accent }]}
          >
            <Text style={[typography.label, { color: direction === 'income' ? colors.onAccent : colors.text }]}>Income</Text>
          </Pressable>
        </View>}

        <AmountField value={amount} onChangeText={setAmount} autoFocus={!editing} editable={!editing || canEditDetectedIncome} />

        {direction === 'expense' && (
          <>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((c) => {
                const selected = c.id === categoryId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    hitSlop={4}
                    android_ripple={{ color: colors.border }}
                    style={({ pressed }) => [
                      styles.categoryCell,
                      {
                        borderColor: selected ? colors.accent : colors.border,
                        backgroundColor: colors.surface,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Icon name={categoryIconFor(c.name)} size={22} color={selected ? colors.accent : colors.text} />
                    <Text
                      style={[typography.caption, { color: selected ? colors.accent : colors.text, marginTop: spacing.xs, fontWeight: '600' }]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <FormField
          label="Name"
          placeholder={direction === 'income' ? 'e.g. Bonus, Gift, Refund' : 'e.g. Swiggy, IndianOil, Cab, etc.'}
          value={merchant}
          onChangeText={setMerchant}
        />

        <Button title={editing ? 'Save changes' : 'Save'} onPress={handleSave} disabled={!canSave} loading={saving} />

        {editing ? (
          <Button title="Delete transaction" variant="destructive" onPress={handleDelete} style={{ marginTop: spacing.md }} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggle: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    alignSelf: 'flex-end',
  },
  toggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryCell: {
    width: '22%',
    aspectRatio: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
