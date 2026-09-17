import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
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
import type { IncomeSourceType } from '../../models/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Income'>;

export function IncomeScreen({}: Props) {
  const { colors } = useTheme();
  const incomeSources = useBudgetStore((s) => s.incomeSources);
  const addIncome = useBudgetStore((s) => s.addIncome);
  const updateIncome = useBudgetStore((s) => s.updateIncome);
  const deleteIncome = useBudgetStore((s) => s.deleteIncome);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [guaranteed, setGuaranteed] = useState(true);
  const [received, setReceived] = useState(false);
  const [editing, setEditing] = useState<Record<string, string>>({});

  async function handleAdd() {
    if (!name.trim() || !amount) return;
    const type: IncomeSourceType = 'MONTHLY';
    await addIncome({
      name: name.trim(),
      amountPaise: Math.round(parseFloat(amount) * 100),
      type,
      status: received ? 'RECEIVED' : 'EXPECTED',
      guaranteed,
    });
    setName('');
    setAmount('');
  }

  async function commit(id: string) {
    const value = editing[id];
    if (value === undefined) return;
    await updateIncome(id, { amountPaise: Math.round((parseFloat(value) || 0) * 100) });
    setEditing((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert('Remove income source', `Remove "${name}"? It won't carry forward to next cycle.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteIncome(id) },
    ]);
  }

  return (
    <Screen>
      <SectionHeader title="Income sources" />
      {incomeSources.length === 0 ? (
        <EmptyState title="No income added yet" subtitle="Optional — add income for budgeting, or leave this empty to track expenses only." />
      ) : (
        <Entrance index={0}>
        <Surface size="card" style={styles.list}>
          {incomeSources.map((s, i) => (
          <View
            key={s.id}
            style={[styles.row, { borderColor: colors.border }, i === incomeSources.length - 1 && styles.lastRow]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.text }]}>{s.name}</Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                {s.status === 'RECEIVED' ? 'Received' : 'Expected'} · {s.guaranteed ? 'Guaranteed' : 'Uncertain'}
              </Text>
            </View>
            <TextAmount
              value={editing[s.id] ?? String(s.amountPaise / 100)}
              onChangeText={(v) => setEditing((e) => ({ ...e, [s.id]: v }))}
              onBlur={() => commit(s.id)}
            />
            <IconButton
              glyph="−"
              color={colors.negative}
              accessibilityLabel={`Remove ${s.name}`}
              onPress={() => confirmDelete(s.id, s.name)}
              style={styles.deleteBtn}
            />
          </View>
          ))}
        </Surface>
        </Entrance>
      )}

      <SectionHeader title="Add income" />
      <FormField label="Name" placeholder="e.g. Salary" value={name} onChangeText={setName} />
      <AmountField label="Amount" value={amount} onChangeText={setAmount} />

      <ToggleRow label="Already received" value={received} onChange={setReceived} />
      <ToggleRow label="Guaranteed" value={guaranteed} onChange={setGuaranteed} />

      <View style={{ height: spacing.md }} />
      <Button title="Add income" onPress={handleAdd} disabled={!name.trim() || !amount} />
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

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.surfaceAlt, true: colors.text }} />
    </View>
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
