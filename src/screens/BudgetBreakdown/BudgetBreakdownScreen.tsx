import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { spacing, typography } from '../../app/theme/theme';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import { Entrance } from '../../app/motion/animations';
import { MoneyText } from '../../components/MoneyText';
import { Icon, IconName } from '../../components/Icon';
import { useBudgetStore } from '../../store/budgetStore';
import { discretionaryBudgetPaise } from '../../budget/calculateSavings';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetBreakdown'>;

export function BudgetBreakdownScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const cycle = useBudgetStore((s) => s.cycle);
  const incomeSources = useBudgetStore((s) => s.incomeSources);
  const fixedExpenses = useBudgetStore((s) => s.fixedExpenses);
  const plannedExpenses = useBudgetStore((s) => s.plannedExpenses);

  if (!cycle) return null;

  const discretionary = discretionaryBudgetPaise({
    incomeSources, fixedExpenses, plannedExpenses, savingsTargetPaise: cycle.savingsTargetPaise,
  });
  const incomeTotal = incomeSources.reduce((sum, i) => sum + i.amountPaise, 0);
  const fixedTotal = fixedExpenses.reduce((sum, f) => sum + f.amountPaise, 0);
  const plannedTotal = plannedExpenses.reduce((sum, p) => sum + p.amountPaise, 0);

  return (
    <Screen>
      <Entrance index={0}>
        <Surface size="card" style={styles.hero}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>AVAILABLE TO BUDGET</Text>
          <MoneyText paise={discretionary} style={[typography.display, { fontSize: 36, marginTop: 2 }]} tone="auto" />
        </Surface>
      </Entrance>

      <Group
        index={1}
        icon="arrow-up"
        tint="rgba(79,190,124,0.15)"
        tintColor={colors.positive}
        title="Income"
        total={incomeTotal}
        items={incomeSources.map((i) => ({
          id: i.id,
          name: i.name,
          paise: i.amountPaise,
          note: `${i.status === 'RECEIVED' ? 'Received' : 'Expected'} · ${i.guaranteed ? 'Guaranteed' : 'Uncertain'}`,
        }))}
        emptyLabel="No income added"
        onManage={() => navigation.navigate('Income')}
      />

      <Group
        index={2}
        icon="arrow-down"
        tint="rgba(255,107,99,0.15)"
        tintColor={colors.negative}
        title="Fixed expenses"
        total={-fixedTotal}
        items={fixedExpenses.map((f) => ({
          id: f.id,
          name: f.name,
          paise: -f.amountPaise,
          note: f.status === 'PAID' ? 'Paid' : 'Due this cycle',
        }))}
        emptyLabel="No fixed expenses"
        onManage={() => navigation.navigate('FixedExpenses')}
      />

      <Group
        index={3}
        icon="calendar"
        tint="rgba(227,179,65,0.15)"
        tintColor={colors.warning}
        title="One-time expenses"
        total={-plannedTotal}
        items={plannedExpenses.map((p) => ({
          id: p.id,
          name: p.name,
          paise: -p.amountPaise,
          note: p.paid ? 'Paid' : 'Not yet paid',
        }))}
        emptyLabel="No one-time expenses"
        onManage={() => navigation.navigate('PlannedExpenses')}
      />

      <Group
        index={4}
        icon="piggy-bank"
        tint="rgba(167,139,250,0.16)"
        tintColor="#A78BFA"
        title="Reserved savings"
        total={-cycle.savingsTargetPaise}
        items={[{ id: 'savings', name: 'Set aside this cycle', paise: -cycle.savingsTargetPaise, note: 'Kept out of daily budget' }]}
        emptyLabel=""
        onManage={() => navigation.navigate('BudgetSetup')}
      />
    </Screen>
  );
}

function Group({
  index,
  icon,
  tint,
  tintColor,
  title,
  total,
  items,
  emptyLabel,
  onManage,
}: {
  index: number;
  icon: IconName;
  tint: string;
  tintColor: string;
  title: string;
  total: number;
  items: { id: string; name: string; paise: number; note: string }[];
  emptyLabel: string;
  onManage: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Entrance index={index}>
    <Surface size="card" style={styles.card}>
      <Pressable onPress={onManage} hitSlop={6} style={({ pressed }) => [styles.groupHeader, { opacity: pressed ? 0.6 : 1 }]}>
        <View style={[styles.iconCircle, { backgroundColor: tint }]}>
          <Icon name={icon} size={16} color={tintColor} />
        </View>
        <Text style={[typography.body, { color: colors.text, fontWeight: '700', flex: 1, marginLeft: spacing.sm }]}>{title}</Text>
        <MoneyText paise={total} style={[typography.body, { fontWeight: '700' }]} />
        <View style={{ marginLeft: 4 }}>
          <Icon name="chevron-right" size={14} color={colors.textMuted} />
        </View>
      </Pressable>

      {items.length === 0 ? (
        emptyLabel ? <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>{emptyLabel}</Text> : null
      ) : (
        items.map((item) => (
          <View key={item.id} style={[styles.itemRow, { borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 1 }]}>{item.note}</Text>
            </View>
            <MoneyText paise={item.paise} style={typography.body} />
          </View>
        ))
      )}
    </Surface>
    </Entrance>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
});
