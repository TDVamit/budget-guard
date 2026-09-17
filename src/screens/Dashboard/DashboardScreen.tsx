import React, { useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { motion, spacing, typography } from '../../app/theme/theme';
import { Surface, PressableSurface, useDepth } from '../../components/Surface';
import { AmbientBackground } from '../../components/AmbientBackground';
import { Entrance, useFillProgress } from '../../app/motion/animations';
import { Screen } from '../../components/Screen';
import { MoneyText, formatRupees, formatRupeesCompact } from '../../components/MoneyText';
import { EmptyState } from '../../components/EmptyState';
import { Icon, IconName, categoryIconFor } from '../../components/Icon';
import { CircularProgress } from '../../components/CircularProgress';
import { useBudgetStore } from '../../store/budgetStore';
import { calculateDashboard } from '../../budget/selectors';
import { calculateDailyLedger, type DayResult } from '../../budget/calculateDailyLedger';
import { statusColor } from '../../budget/categoryStatus';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardScreen({ navigation }: Props) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const cycle = useBudgetStore((s) => s.cycle);
  const categories = useBudgetStore((s) => s.categories);
  const transactions = useBudgetStore((s) => s.transactions);
  const incomeSources = useBudgetStore((s) => s.incomeSources);
  const fixedExpenses = useBudgetStore((s) => s.fixedExpenses);
  const plannedExpenses = useBudgetStore((s) => s.plannedExpenses);
  const [transactionsOpen, setTransactionsOpen] = useState(false);

  const dashboard = useMemo(() => {
    if (!cycle) return null;
    return calculateDashboard(cycle, categories, transactions, incomeSources, fixedExpenses, plannedExpenses);
  }, [cycle, categories, transactions, incomeSources, fixedExpenses, plannedExpenses]);

  if (!cycle || !dashboard) {
    return (
      <Screen>
        <EmptyState title="Setting up your budget" />
      </Screen>
    );
  }

  const ledger = calculateDailyLedger(cycle, categories, transactions);
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const recent = transactions.slice(0, 5);
  const accruedSoFar = dashboard.allowances.reduce((sum, a) => sum + a.accruedPaise, 0);
  const spentSoFar = dashboard.allowances.reduce((sum, a) => sum + a.spentPaise, 0);
  const spentRatio = accruedSoFar > 0 ? Math.max(0, Math.min(1, spentSoFar / accruedSoFar)) : 0;

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.background }}>
      <AmbientBackground />
      <Screen>
        <View style={styles.headerRow}>
          <Text style={[typography.body, { color: colors.textMuted }]}>{format(new Date(), 'EEEE, d MMM')}</Text>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Settings"
            hitSlop={12}
            style={({ pressed }) => [styles.iconTap, { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
          >
            <Icon name="settings" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.greetingRow}>
          <Text style={[typography.display, { fontSize: 34, color: colors.text }]}>{greeting(new Date().getHours())}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={[typography.body, { color: colors.textMuted }]}>Your monthly budget</Text>
            <View style={{ marginLeft: spacing.sm, marginRight: 4 }}>
              <Icon name="calendar" size={14} color={colors.textMuted} />
            </View>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              {format(new Date(cycle.startDate), 'd MMM')} – {format(new Date(cycle.endDate), 'd MMM')}
            </Text>
          </View>
        </View>

        {/* Income and the two expense buckets, each opening the full breakdown. */}
        <Entrance index={0}>
        <View style={styles.topRow}>
          <BudgetTile
            style={styles.tallTile}
            icon="arrow-up"
            label="Total income"
            paise={dashboard.incomeTotalPaise}
            tone="positive"
            big
            onPress={() => navigation.navigate('BudgetBreakdown')}
          />
          <View style={styles.tileColumn}>
            <BudgetTile
              icon="arrow-down"
              label="Fixed expenses"
              paise={dashboard.fixedTotalPaise}
              tone="negative"
              onPress={() => navigation.navigate('BudgetBreakdown')}
            />
            <BudgetTile
              icon="calendar"
              label="One-time expenses"
              paise={dashboard.plannedTotalPaise}
              tone="negative"
              onPress={() => navigation.navigate('BudgetBreakdown')}
            />
          </View>
        </View>
        </Entrance>

        <Entrance index={1}>
        <Surface size="card" style={[styles.card, { marginTop: spacing.md }]}>
          <View style={styles.savingsRow}>
            <SavingsBlock
              icon="piggy-bank"
              paise={dashboard.savingsTargetPaise}
              label="Reserved savings"
              sub="already set aside"
            />
            <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
            <SavingsBlock
              icon="bar-chart"
              paise={dashboard.monthlySavedPaise}
              label="Remaining this month"
              sub="unspent budget + extra income"
            />
            <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
            <SavingsBlock
              icon="sparkle"
              paise={dashboard.projectedSavings}
              label="Projected savings"
              sub="reserved + extra"
              tone="positive"
            />
          </View>
        </Surface>
        </Entrance>

        {/* Today's remaining budget, with every category rendered inline underneath. */}
        <Entrance index={2}>
        <Surface size="card" style={[styles.card, { marginTop: spacing.md }]}>
          <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 0.6 }]}>TODAY'S REMAINING BUDGET</Text>
          <MoneyText
            paise={accruedSoFar}
            style={[typography.display, { fontSize: 46, marginTop: spacing.xs }]}
            tone={accruedSoFar < 0 ? 'negative' : 'neutral'}
            animate
          />
          <Bar ratio={spentRatio} tone={statusColor(spentSoFar, accruedSoFar, dark)} />
          <View style={styles.barLegend}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{formatRupees(spentSoFar)} spent</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{formatRupees(accruedSoFar - spentSoFar)} remaining</Text>
          </View>

          <View style={[styles.hDivider, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={() => navigation.navigate('Categories')}
            hitSlop={6}
            style={({ pressed }) => [styles.spread, { marginBottom: spacing.sm, opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[typography.title, { fontSize: 15, color: colors.text }]}>Categories</Text>
            <Icon name="chevron-right" size={16} color={colors.textMuted} />
          </Pressable>
          <View style={styles.categoryGrid}>
            {dashboard.allowances.map((a, i) => (
              <CategoryCard
                key={a.categoryId}
                name={a.name}
                spentPaise={a.spentPaise}
                accruedPaise={a.accruedPaise}
                wide={i === dashboard.allowances.length - 1 && dashboard.allowances.length % 2 === 1}
                onPress={() => navigation.navigate('Categories')}
              />
            ))}
          </View>
        </Surface>
        </Entrance>

        <Entrance index={3}>
          <SectionTitle title="Daily pace" />
          <Surface size="card" style={styles.card}>
            <DayCalendar days={ledger} />
          </Surface>
        </Entrance>

        <Pressable
          onPress={() => setTransactionsOpen((o) => !o)}
          hitSlop={6}
          style={({ pressed }) => [styles.sectionRow, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[typography.title, { fontSize: 18, color: colors.text }]}>Recent transactions</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[typography.caption, { color: colors.textMuted, marginRight: 4 }]}>{transactions.length}</Text>
            <View style={{ transform: [{ rotate: transactionsOpen ? '180deg' : '0deg' }] }}>
              <Icon name="chevron-down" size={18} color={colors.textMuted} />
            </View>
          </View>
        </Pressable>
        {!transactionsOpen ? null : recent.length === 0 ? (
          <EmptyState title="No transactions yet" subtitle="Add one manually, or connect notification detection in Settings." />
        ) : (
          <Surface depth="flat" size="card" style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
            {recent.map((t, i) => (
              <Pressable
                key={t.id}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: t.id })}
                hitSlop={4}
                android_ripple={{ color: colors.border }}
                style={({ pressed }) => [
                  styles.txRow,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  i === recent.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={[styles.txIcon, { backgroundColor: colors.surfaceAlt }]}>
                  <Icon name={categoryIconFor(categoryById[t.categoryId]?.name ?? 'Others')} size={16} color={colors.text} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={[typography.body, { color: colors.text }]} numberOfLines={1}>
                    {t.merchant || t.note || categoryById[t.categoryId]?.name || 'Others'}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                    {format(t.timestamp, 'd MMM, h:mm a')}
                  </Text>
                </View>
                <MoneyText
                  paise={t.direction === 'DEBIT' ? -t.amountPaise : t.amountPaise}
                  tone={t.direction === 'DEBIT' ? 'negative' : 'positive'}
                  style={typography.body}
                />
              </Pressable>
            ))}
            <Pressable
              onPress={() => navigation.navigate('Transactions')}
              hitSlop={6}
              style={({ pressed }) => [styles.viewAllRow, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[typography.body, { color: colors.text }]}>View all</Text>
              <Icon name="chevron-right" size={14} color={colors.text} />
            </Pressable>
          </Surface>
        )}
      </Screen>

      <PressableSurface
        onPress={() => navigation.navigate('AddTransaction')}
        size="pill"
        accessibilityLabel="Add transaction"
        style={[styles.fab, { bottom: spacing.lg + insets.bottom }]}
      >
        <View style={[styles.fabInner, { backgroundColor: colors.accent }]}>
          <Icon name="plus" size={26} color={colors.onAccent} strokeWidth={2.5} />
        </View>
      </PressableSurface>
    </View>
  );
}

function SectionTitle({ title, action, info }: { title: string; action?: React.ReactNode; info?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[typography.title, { fontSize: 18, color: colors.text }]}>{title}</Text>
        {info ? (
          <View style={{ marginLeft: spacing.xs }}>
            <Icon name="info" size={14} color={colors.textMuted} />
          </View>
        ) : null}
      </View>
      {action}
    </View>
  );
}

function Bar({ ratio, tone }: { ratio: number; tone?: string }) {
  const { colors } = useTheme();
  const groove = useDepth('inset', 0.45);
  const progress = useFillProgress(motion.focal, 120);
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`],
  });
  return (
    <View style={[styles.barTrack, groove]}>
      <Animated.View style={[styles.barFill, { width, backgroundColor: tone ?? colors.text }]} />
    </View>
  );
}

function CategoryCard({
  name,
  spentPaise,
  accruedPaise,
  wide,
  onPress,
}: {
  name: string;
  spentPaise: number;
  accruedPaise: number;
  /** Last card on an odd count spans the row. */
  wide?: boolean;
  onPress: () => void;
}) {
  const { colors, dark } = useTheme();
  const ratio = accruedPaise > 0 ? spentPaise / accruedPaise : 0;
  const leftPaise = accruedPaise - spentPaise;
  // Colour carries meaning here: how much of what has accrued is already spent.
  const color = statusColor(spentPaise, accruedPaise, dark);

  const left = (
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <CircularProgress ratio={ratio} size={42} strokeWidth={4} color={color}>
        <Icon name={categoryIconFor(name)} size={16} color={colors.text} />
      </CircularProgress>
      <View style={{ marginLeft: spacing.sm, flex: 1 }}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 1 }]} numberOfLines={1}>
          {formatRupees(spentPaise)} of {formatRupees(accruedPaise)}
        </Text>
        {!wide ? <LeftAmount paise={leftPaise} /> : null}
      </View>
    </View>
  );

  return (
    <PressableSurface
      onPress={onPress}
      size="tile"
      intensity={0.7}
      accessibilityLabel={`${name}, ${formatRupees(leftPaise)} left`}
      style={[styles.categoryCard, wide && styles.categoryCardWide]}
    >
      {left}
      {wide ? <LeftAmount paise={leftPaise} /> : null}
    </PressableSurface>
  );
}

function LeftAmount({ paise }: { paise: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
      <MoneyText paise={paise} style={[typography.body, { fontWeight: '700' }]} tone="auto" />
      <Text style={[styles.subLabel, { color: colors.textMuted, marginLeft: 3, marginTop: 0, height: 13 }]}>left</Text>
    </View>
  );
}

function BudgetTile({
  icon,
  label,
  paise,
  tone,
  big,
  style,
  onPress,
}: {
  icon: IconName;
  label: string;
  paise: number;
  tone: 'positive' | 'negative';
  big?: boolean;
  style?: object;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableSurface onPress={onPress} size="tile" accessibilityLabel={label} style={[styles.tile, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name={icon} size={13} color={colors.textMuted} />
        <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 5 }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={{ flex: big ? 1 : 0, justifyContent: 'center', alignItems: big ? 'center' : 'flex-start', paddingVertical: big ? spacing.md : 0 }}>
        <MoneyText
          paise={tone === 'negative' ? -paise : paise}
          style={[typography.display, { fontSize: big ? 30 : 20, marginTop: big ? 0 : spacing.xs }]}
          tone={tone}
        />
      </View>
      <View>
        <View style={styles.tileLink}>
          <Text style={[typography.caption, { color: colors.textMuted, fontSize: 11 }]}>Breakdown</Text>
          <Icon name="chevron-right" size={12} color={colors.textMuted} />
        </View>
      </View>
    </PressableSurface>
  );
}

/** One square per cycle day: green when the day came in under its share, red when over. */
function DayCalendar({ days }: { days: DayResult[] }) {
  const { colors, dark } = useTheme();
  const past = days.filter((d) => !d.isFuture);
  const savedDays = past.filter((d) => d.savedPaise > 0).length;
  const overDays = past.filter((d) => d.savedPaise < 0).length;

  return (
    <View>
      <View style={styles.spread}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {savedDays} under · {overDays} over
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {formatRupees(days[0]?.allowancePaise ?? 0)}/day
        </Text>
      </View>

      <View style={styles.calendarGrid}>
        {days.map((d) => {
          // A tinted day plus the amount itself: colour reads at a glance, the
          // number is there for anyone who cannot use it.
          const over = !d.isFuture && d.savedPaise < 0;
          const under = !d.isFuture && d.savedPaise > 0;
          const background = over
            ? (dark ? 'rgba(255,107,99,0.20)' : 'rgba(194,50,31,0.12)')
            : under
              ? (dark ? 'rgba(61,220,132,0.18)' : 'rgba(10,125,69,0.12)')
              : 'transparent';
          const amountColor = over ? colors.negative : colors.positive;
          return (
            <Entrance key={d.dayOfCycle} index={Math.min(d.dayOfCycle, 12)} distance={6} duration={motion.state}>
            <View
              style={[
                styles.calendarCell,
                {
                  backgroundColor: background,
                  borderColor: colors.border,
                  borderWidth: d.isFuture || (!over && !under) ? StyleSheet.hairlineWidth : 0,
                },
              ]}
            >
              <Text style={[styles.calendarDay, { color: colors.textMuted }]}>
                {d.dayOfCycle}
              </Text>
              {!d.isFuture && d.spentPaise !== 0 ? (
                <Text style={[styles.calendarAmount, { color: amountColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {formatRupeesCompact(d.spentPaise)}
                </Text>
              ) : null}
            </View>
            </Entrance>
          );
        })}
      </View>

      <View style={[styles.spread, { marginTop: spacing.sm }]}>
        <Legend color="rgba(61,220,132,0.28)" label="Under budget" />
        <Legend color="rgba(255,107,99,0.30)" label="Over" />
        <Legend color={colors.surfaceAlt} label="To come" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          backgroundColor: color,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        }}
      />
      <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 4, fontSize: 11 }]}>{label}</Text>
    </View>
  );
}

function SavingsBlock({
  icon,
  paise,
  label,
  sub,
  tone,
}: {
  icon: IconName;
  paise: number;
  label: string;
  sub?: string;
  tone?: 'positive';
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.savingsBlock}>
      <View style={[styles.statIconCircle, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name={icon} size={16} color={tone === 'positive' ? colors.positive : colors.text} />
      </View>
      <MoneyText
        paise={paise}
        style={[typography.body, { fontWeight: '700', marginTop: spacing.xs }]}
        tone={tone === 'positive' ? 'positive' : 'auto'}
      />
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2, textAlign: 'center' }]} numberOfLines={2}>
        {label}
      </Text>
      {/* Fixed height keeps the three blocks aligned when one caption wraps. */}
      <Text style={[styles.subLabel, { color: colors.textMuted }]} numberOfLines={2}>
        {sub ?? ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  iconTap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  barFill: {
    height: 10,
    borderRadius: 5,
  },
  barLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  spread: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tallTile: {
    flex: 1,
  },
  tileColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  tile: {
    padding: spacing.md,
  },
  tileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 2,
    marginTop: spacing.sm,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: spacing.sm,
  },
  calendarCell: {
    // No flexGrow: a short last row must keep the same cell size, not stretch.
    width: '10%',
    minWidth: 28,
    height: 36,
    borderRadius: 10,
    paddingTop: 3,
    alignItems: 'center',
  },
  calendarDay: {
    fontSize: 9,
    lineHeight: 11,
  },
  calendarAmount: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: 86,
  },
  categoryCardWide: {
    flexBasis: '100%',
    justifyContent: 'space-between',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  savingsBlock: {
    flex: 1,
    alignItems: 'center',
  },
  subLabel: {
    fontSize: 10,
    lineHeight: 13,
    height: 26,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 1,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: spacing.xs,
  },
  hDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
