import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { spacing, typography } from '../../app/theme/theme';
import { Screen } from '../../components/Screen';
import { Surface, PressableSurface } from '../../components/Surface';
import { Entrance } from '../../app/motion/animations';
import { SectionHeader } from '../../components/SectionHeader';
import { AmountField } from '../../components/FormField';
import { Button } from '../../components/Button';
import { useBudgetStore } from '../../store/budgetStore';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetSetup'>;

export function BudgetSetupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const cycle = useBudgetStore((s) => s.cycle);
  const incomeSources = useBudgetStore((s) => s.incomeSources);
  const fixedExpenses = useBudgetStore((s) => s.fixedExpenses);
  const plannedExpenses = useBudgetStore((s) => s.plannedExpenses);
  const categories = useBudgetStore((s) => s.categories);
  const updateSavingsTarget = useBudgetStore((s) => s.updateSavingsTarget);

  const [savings, setSavings] = useState(cycle ? String(cycle.savingsTargetPaise / 100) : '');

  if (!cycle) return null;

  return (
    <Screen>
      <Entrance index={0}>
        <Surface size="card" style={styles.hero}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>Current cycle</Text>
          <Text style={[typography.title, { color: colors.text, marginTop: spacing.xs }]}>
            {format(new Date(cycle.startDate), 'd MMM')} – {format(new Date(cycle.endDate), 'd MMM yyyy')}
          </Text>
        </Surface>
      </Entrance>

      <SectionHeader title="Savings target" />
      <Entrance index={1}>
        <AmountField value={savings} onChangeText={setSavings} />
        <Button
          title="Save target"
          onPress={() => updateSavingsTarget(Math.round((parseFloat(savings) || 0) * 100))}
        />
      </Entrance>

      <SectionHeader title="Configuration" />
      <Entrance index={2}>
        <NavRow label="Income sources" countLabel={`${incomeSources.length}`} onPress={() => navigation.navigate('Income')} />
        <NavRow label="Fixed expenses" countLabel={`${fixedExpenses.length}`} onPress={() => navigation.navigate('FixedExpenses')} />
        <NavRow label="One-time expenses" countLabel={`${plannedExpenses.length}`} onPress={() => navigation.navigate('PlannedExpenses')} />
        <NavRow label="Categories" countLabel={`${categories.length}`} onPress={() => navigation.navigate('Categories')} />
      </Entrance>
    </Screen>
  );
}

function NavRow({ label, countLabel, onPress }: { label: string; countLabel: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableSurface onPress={onPress} size="tile" accessibilityLabel={label} style={styles.navRow}>
      <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
      <View style={styles.navRight}>
        <Text style={{ color: colors.textMuted }}>{countLabel}</Text>
        <Text style={{ color: colors.textMuted }}>›</Text>
      </View>
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  navRight: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
});
