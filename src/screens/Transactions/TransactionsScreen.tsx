import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { endOfDay, endOfWeek, format, isWithinInterval, startOfDay, startOfWeek } from 'date-fns';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { spacing, typography } from '../../app/theme/theme';
import { Surface, PressableSurface } from '../../components/Surface';
import { Entrance } from '../../app/motion/animations';
import { TransactionRow } from '../../components/TransactionRow';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { MoneyText } from '../../components/MoneyText';
import { useBudgetStore } from '../../store/budgetStore';
import { cycleDayNumber, cycleLengthDays } from '../../budget/calculateCycle';
import { categorySpendPaise } from '../../budget/calculateCategoryAllowance';
import * as cycleRepo from '../../database/repositories/cycleRepository';
import * as categoryRepo from '../../database/repositories/categoryRepository';
import * as txRepo from '../../database/repositories/transactionRepository';
import type { BudgetCategory, BudgetCycle, Transaction } from '../../models/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;
type RangeMode = 'day' | 'week' | 'cycle';

function categoryBreakdown(transactions: Transaction[], categories: BudgetCategory[]) {
  return categories
    .map((c) => ({ id: c.id, name: c.name, spentPaise: categorySpendPaise(transactions, c.id) }))
    .filter((c) => c.spentPaise > 0)
    .sort((a, b) => b.spentPaise - a.spentPaise);
}

export function TransactionsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const cycle = useBudgetStore((s) => s.cycle);
  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);
  const refresh = useBudgetStore((s) => s.refresh);
  const [mode, setMode] = useState<RangeMode>('cycle');
  const [refreshing, setRefreshing] = useState(false);

  // A payment detected from an SMS or email is written straight to the database
  // by the background listener, so this re-reads it without restarting the app.
  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={reload} hitSlop={12} accessibilityLabel="Refresh" disabled={refreshing}>
          <Icon name="refresh" size={20} color={refreshing ? colors.textMuted : colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, reload, refreshing, colors]);

  const [pastCycles, setPastCycles] = useState<BudgetCycle[]>([]);
  const [viewingCycle, setViewingCycle] = useState<BudgetCycle | null>(null);
  const [pastTransactions, setPastTransactions] = useState<Transaction[]>([]);
  const [pastCategories, setPastCategories] = useState<BudgetCategory[]>([]);

  useEffect(() => {
    cycleRepo.listClosedCycles().then(setPastCycles);
  }, []);

  useEffect(() => {
    if (!viewingCycle) return;
    Promise.all([
      txRepo.listTransactions(viewingCycle.id),
      categoryRepo.listCategories(viewingCycle.id),
    ]).then(([t, c]) => {
      setPastTransactions(t);
      setPastCategories(c);
    });
  }, [viewingCycle]);

  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const pastCategoryById = Object.fromEntries(pastCategories.map((c) => [c.id, c]));

  const range = useMemo(() => {
    const now = new Date();
    if (mode === 'day') return { start: startOfDay(now), end: endOfDay(now) };
    if (mode === 'week') return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    return { start: new Date(cycle!.startDate), end: new Date(cycle!.endDate + 'T23:59:59') };
  }, [mode, cycle]);

  const filtered = useMemo(
    () => (viewingCycle ? pastTransactions : transactions.filter((t) => isWithinInterval(t.timestamp, range))),
    [viewingCycle, pastTransactions, transactions, range],
  );

  const totalSpent = filtered
    .filter((t) => t.type === 'VARIABLE_EXPENSE' && t.direction === 'DEBIT')
    .reduce((sum, t) => sum + t.amountPaise, 0);

  const breakdown = useMemo(
    () => categoryBreakdown(filtered, viewingCycle ? pastCategories : categories),
    [filtered, viewingCycle, pastCategories, categories],
  );

  const sections = useMemo(() => {
    const byDay = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const key = format(t.timestamp, 'EEEE, d MMM');
      byDay.set(key, [...(byDay.get(key) || []), t]);
    }
    return Array.from(byDay.entries()).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  if (!cycle) return null;
  const cycleDay = cycleDayNumber(cycle);
  const cycleLength = cycleLengthDays(cycle);
  const activeCategoryById = viewingCycle ? pastCategoryById : categoryById;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {viewingCycle ? (
        <View style={styles.pastHeader}>
          <Pressable onPress={() => setViewingCycle(null)} hitSlop={8}>
            <Text style={[typography.label, { color: colors.accent }]}>‹ Back to current cycle</Text>
          </Pressable>
          <Text style={[typography.title, { color: colors.text, marginTop: spacing.xs }]}>
            {format(new Date(viewingCycle.startDate), 'MMM d')} – {format(new Date(viewingCycle.endDate), 'MMM d, yyyy')}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.tabs}>
            {(['day', 'week', 'cycle'] as RangeMode[]).map((m) => (
              // Depth carries selection: the active range stands proud of the panel.
              <PressableSurface
                key={m}
                onPress={() => setMode(m)}
                depth={mode === m ? 'raised' : 'inset'}
                size="control"
                accessibilityLabel={m}
                style={[styles.tab, mode === m && { backgroundColor: colors.accent }]}
              >
                <Text style={{ color: mode === m ? colors.onAccent : colors.text, fontWeight: '500' }}>
                  {m === 'day' ? 'Day' : m === 'week' ? 'Week' : `Cycle (${cycleDay}/${cycleLength})`}
                </Text>
              </PressableSurface>
            ))}
          </View>

          {pastCycles.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pastChipRow}>
              {pastCycles.map((item) => (
                <PressableSurface
                  key={item.id}
                  onPress={() => setViewingCycle(item)}
                  size="pill"
                  accessibilityLabel={format(new Date(item.startDate), 'MMM yyyy')}
                  style={styles.pastChip}
                >
                  <Text style={{ color: colors.text }}>{format(new Date(item.startDate), 'MMM yyyy')}</Text>
                </PressableSurface>
              ))}
            </ScrollView>
          )}
        </>
      )}

      <Entrance index={0}>
        <Surface size="card" style={styles.summary}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>Total spent</Text>
          <MoneyText paise={totalSpent} tone="negative" style={typography.title} />
        </Surface>
      </Entrance>

      {breakdown.length > 0 && (
        <Entrance index={1}>
          <Surface size="card" style={styles.card}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.xs }]}>SPEND BY CATEGORY</Text>
            {breakdown.map((c) => (
              <View key={c.id} style={styles.breakdownRow}>
                <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{c.name}</Text>
                <MoneyText paise={c.spentPaise} tone="negative" style={typography.body} />
              </View>
            ))}
          </Surface>
        </Entrance>
      )}

      {filtered.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.text} colors={[colors.accent]} />}
        >
          <EmptyState title="No transactions in this range" subtitle="Pull down to check for newly detected payments." />
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.text} colors={[colors.accent]} />}
          renderSectionHeader={({ section }) => (
            <Text style={[typography.label, { color: colors.textMuted, backgroundColor: colors.background, paddingVertical: spacing.sm }]}>
              {section.title.toUpperCase()}
            </Text>
          )}
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item}
              categoryName={activeCategoryById[item.categoryId]?.name ?? 'Others'}
              onPress={() => !viewingCycle && navigation.navigate('TransactionDetail', { transactionId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastHeader: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pastChipRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  pastChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  summary: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
