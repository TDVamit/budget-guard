import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { spacing, typography } from '../../app/theme/theme';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import { Entrance } from '../../app/motion/animations';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { AmountField, FormField } from '../../components/FormField';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { useBudgetStore } from '../../store/budgetStore';

type Props = NativeStackScreenProps<RootStackParamList, 'FixedExpenses'>;

export function FixedExpensesScreen({}: Props) {
  const { colors } = useTheme();
  const fixedExpenses = useBudgetStore((s) => s.fixedExpenses);
  const addFixedExpense = useBudgetStore((s) => s.addFixedExpense);
  const updateFixedExpense = useBudgetStore((s) => s.updateFixedExpense);
  const deleteFixedExpense = useBudgetStore((s) => s.deleteFixedExpense);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [editing, setEditing] = useState<Record<string, string>>({});

  async function handleAdd() {
    if (!name.trim() || !amount) return;
    await addFixedExpense({
      name: name.trim(),
      amountPaise: Math.round(parseFloat(amount) * 100),
      recurring: true,
      type: 'BILL',
    });
    setName('');
    setAmount('');
  }

  async function commit(id: string) {
    const value = editing[id];
    if (value === undefined) return;
    await updateFixedExpense(id, { amountPaise: Math.round((parseFloat(value) || 0) * 100) });
    setEditing((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert('Remove fixed expense', `Remove "${name}"? It won't carry forward to next cycle.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteFixedExpense(id) },
    ]);
  }

  return (
    <Screen>
      <SectionHeader title="Fixed monthly expenses" />
      {fixedExpenses.length === 0 ? (
        <EmptyState title="No fixed expenses yet" subtitle="EMIs, subscriptions, bills — anything recurring." />
      ) : (
        <Entrance index={0}>
        <Surface size="card" style={styles.list}>
          {fixedExpenses.map((f, i) => (
          <View
            key={f.id}
            style={[styles.row, { borderColor: colors.border }, i === fixedExpenses.length - 1 && styles.lastRow]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.text }]}>{f.name}</Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                {f.status === 'PAID' ? 'Paid this cycle' : 'Not paid yet'}
              </Text>
            </View>
            <TextAmount
              value={editing[f.id] ?? String(f.amountPaise / 100)}
              onChangeText={(v) => setEditing((e) => ({ ...e, [f.id]: v }))}
              onBlur={() => commit(f.id)}
            />
            <IconButton
              glyph="−"
              color={colors.negative}
              accessibilityLabel={`Remove ${f.name}`}
              onPress={() => confirmDelete(f.id, f.name)}
              style={styles.deleteBtn}
            />
          </View>
          ))}
        </Surface>
        </Entrance>
      )}

      <SectionHeader title="Add fixed expense" />
      <FormField label="Name" placeholder="e.g. Laptop EMI" value={name} onChangeText={setName} />
      <AmountField label="Amount" value={amount} onChangeText={setAmount} />
      <Button title="Add fixed expense" onPress={handleAdd} disabled={!name.trim() || !amount} />
    </Screen>
  );
}

function TextAmount({ value, onChangeText, onBlur }: { value: string; onChangeText: (v: string) => void; onBlur: () => void }) {
  const { colors } = useTheme();
  return (
    <Surface depth="inset" size="sm" style={styles.amountBox}>
      <Text style={{ color: colors.textMuted, marginRight: 2 }}>₹</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType="number-pad"
        style={{ color: colors.text, minWidth: 50, textAlign: 'right', padding: 0 }}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginLeft: spacing.sm,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});
