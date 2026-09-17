import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconButton } from '../../components/IconButton';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { spacing, typography } from '../../app/theme/theme';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import { Entrance } from '../../app/motion/animations';
import { SectionHeader } from '../../components/SectionHeader';
import { AmountField, FormField } from '../../components/FormField';
import { Button } from '../../components/Button';
import { MoneyText } from '../../components/MoneyText';
import { useBudgetStore } from '../../store/budgetStore';
import { discretionaryBudgetPaise } from '../../budget/calculateSavings';

type Props = NativeStackScreenProps<RootStackParamList, 'Categories'>;

export function CategoriesScreen({}: Props) {
  const { colors } = useTheme();
  const cycle = useBudgetStore((s) => s.cycle);
  const categories = useBudgetStore((s) => s.categories);
  const incomeSources = useBudgetStore((s) => s.incomeSources);
  const fixedExpenses = useBudgetStore((s) => s.fixedExpenses);
  const plannedExpenses = useBudgetStore((s) => s.plannedExpenses);
  const addCategory = useBudgetStore((s) => s.addCategory);
  const updateCategoryAllocation = useBudgetStore((s) => s.updateCategoryAllocation);
  const deleteCategory = useBudgetStore((s) => s.deleteCategory);

  const [editing, setEditing] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  if (!cycle) return null;

  const discretionary = discretionaryBudgetPaise({
    incomeSources, fixedExpenses, plannedExpenses, savingsTargetPaise: cycle.savingsTargetPaise,
  });
  async function commit(id: string) {
    const value = editing[id];
    if (value === undefined) return;
    const paise = Math.round((parseFloat(value) || 0) * 100);
    await updateCategoryAllocation(id, paise);
    setEditing((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    const paise = Math.round((parseFloat(newAmount) || 0) * 100);
    await addCategory(newName.trim(), paise);
    setNewName('');
    setNewAmount('');
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert('Delete category', `Delete "${name}"? Its budget will no longer accrue.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(id) },
    ]);
  }

  return (
    <Screen>
      <Entrance index={0}>
        <Surface size="card" style={styles.hero}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>Available to budget</Text>
          <MoneyText paise={discretionary} style={typography.display} />
        </Surface>
      </Entrance>

      <SectionHeader title="Categories" />
      <Entrance index={1}>
        <Surface size="card" style={styles.list}>
          {categories.map((c, i) => (
            <View
              key={c.id}
              style={[styles.row, { borderColor: colors.border }, i === categories.length - 1 && styles.lastRow]}
            >
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{c.name}</Text>
              {c.isSystemCategory ? (
                <MoneyText paise={c.allocatedPaise} tone={c.allocatedPaise < 0 ? 'negative' : 'neutral'} style={[typography.body, styles.othersAmount]} />
              ) : (
                <TextAmount
                  value={editing[c.id] ?? String(c.allocatedPaise / 100)}
                  onChangeText={(v) => setEditing((e) => ({ ...e, [c.id]: v }))}
                  onBlur={() => commit(c.id)}
                />
              )}
              {!c.isSystemCategory ? (
                <IconButton
                  glyph="−"
                  color={colors.negative}
                  accessibilityLabel={`Delete ${c.name}`}
                  onPress={() => confirmDelete(c.id, c.name)}
                  style={styles.deleteBtn}
                />
              ) : (
                <View style={styles.deleteBtn} />
              )}
            </View>
          ))}
        </Surface>
      </Entrance>

      <SectionHeader title="Add category" />
      <Entrance index={2}>
        <FormField label="Name" placeholder="e.g. Fuel" value={newName} onChangeText={setNewName} />
        <AmountField label="Budget for this cycle" value={newAmount} onChangeText={setNewAmount} />
        <Button title="Add category" onPress={handleAdd} disabled={!newName.trim()} />
      </Entrance>
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
  hero: {
    padding: spacing.lg,
  },
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
    marginRight: spacing.sm,
  },
  othersAmount: {
    marginRight: spacing.sm,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
