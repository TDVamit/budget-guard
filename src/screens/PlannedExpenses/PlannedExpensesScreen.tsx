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

type Props = NativeStackScreenProps<RootStackParamList, 'PlannedExpenses'>;

export function PlannedExpensesScreen({}: Props) {
  const { colors } = useTheme();
  const plannedExpenses = useBudgetStore((s) => s.plannedExpenses);
  const addPlannedExpense = useBudgetStore((s) => s.addPlannedExpense);
  const updatePlannedExpense = useBudgetStore((s) => s.updatePlannedExpense);
  const deletePlannedExpense = useBudgetStore((s) => s.deletePlannedExpense);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [editing, setEditing] = useState<Record<string, string>>({});

  async function handleAdd() {
    if (!name.trim() || !amount) return;
    await addPlannedExpense({ name: name.trim(), amountPaise: Math.round(parseFloat(amount) * 100) });
    setName('');
    setAmount('');
  }

  async function commit(id: string) {
    const value = editing[id];
    if (value === undefined) return;
    await updatePlannedExpense(id, { amountPaise: Math.round((parseFloat(value) || 0) * 100) });
    setEditing((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert('Remove one-time expense', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deletePlannedExpense(id) },
    ]);
  }

  return (
    <Screen>
      <SectionHeader title="One-time expenses" />
      {plannedExpenses.length === 0 ? (
        <EmptyState title="Nothing added yet" subtitle="Happens once this cycle — won't repeat next month. A trip, a gift, a repair." />
      ) : (
        <Entrance index={0}>
        <Surface size="card" style={styles.list}>
          {plannedExpenses.map((p, i) => (
          <View
            key={p.id}
            style={[styles.row, { borderColor: colors.border }, i === plannedExpenses.length - 1 && styles.lastRow]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.text }]}>{p.name}</Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                {p.paid ? 'Paid' : 'Reserved'}
              </Text>
            </View>
            <TextAmount
              value={editing[p.id] ?? String(p.amountPaise / 100)}
              onChangeText={(v) => setEditing((e) => ({ ...e, [p.id]: v }))}
              onBlur={() => commit(p.id)}
            />
            <IconButton
              glyph="−"
              color={colors.negative}
              accessibilityLabel={`Remove ${p.name}`}
              onPress={() => confirmDelete(p.id, p.name)}
              style={styles.deleteBtn}
            />
          </View>
          ))}
        </Surface>
        </Entrance>
      )}

      <SectionHeader title="Add one-time expense" />
      <FormField label="Name" placeholder="e.g. Bike service" value={name} onChangeText={setName} />
      <AmountField label="Amount" value={amount} onChangeText={setAmount} />
      <Button title="Add one-time expense" onPress={handleAdd} disabled={!name.trim() || !amount} />
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
