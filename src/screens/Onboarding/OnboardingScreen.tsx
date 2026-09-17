import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '../../components/IconButton';
import { Icon, IconName, categoryIconFor } from '../../components/Icon';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { spacing, typography } from '../../app/theme/theme';
import { Surface, PressableSurface, useDepth } from '../../components/Surface';
import { AmbientBackground } from '../../components/AmbientBackground';
import { AmountField, FormField } from '../../components/FormField';
import { Button } from '../../components/Button';
import { MoneyText, formatRupees } from '../../components/MoneyText';
import { useBudgetStore, firstCycleStartDateFromSalaryDay } from '../../store/budgetStore';
import { useSettingsStore } from '../../store/settingsStore';
import { discretionaryBudgetPaise } from '../../budget/calculateSavings';
import { cycleLengthDays } from '../../budget/calculateCycle';
import { accruedAllowancePaise } from '../../budget/calculateAccrual';
import { OTHERS_CATEGORY_NAME } from '../../models/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

type DraftEntry = { name: string; amountPaise: number; oneTime?: boolean };

const STEPS = ['Income', 'Fixed expenses', 'One-time expenses', 'Savings', 'Budget cycle', "This month's budget", 'How it works', 'Notifications'] as const;

export function OnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const startFirstCycle = useBudgetStore((s) => s.startFirstCycle);
  const addIncome = useBudgetStore((s) => s.addIncome);
  const addFixedExpense = useBudgetStore((s) => s.addFixedExpense);
  const addPlannedExpense = useBudgetStore((s) => s.addPlannedExpense);
  const addCategory = useBudgetStore((s) => s.addCategory);
  const updateCategoryAllocation = useBudgetStore((s) => s.updateCategoryAllocation);
  const deleteCategory = useBudgetStore((s) => s.deleteCategory);
  const categories = useBudgetStore((s) => s.categories);
  const cycle = useBudgetStore((s) => s.cycle);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);

  const [step, setStep] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [incomes, setIncomes] = useState<DraftEntry[]>([]);
  const [fixed, setFixed] = useState<DraftEntry[]>([]);
  const [planned, setPlanned] = useState<DraftEntry[]>([]);
  const [savingsTarget, setSavingsTarget] = useState('');
  const [salaryDay, setSalaryDay] = useState('1');
  const [cycleMode, setCycleMode] = useState<'SALARY_DAY' | 'CUSTOM_DATES'>('SALARY_DAY');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [creatingCycle, setCreatingCycle] = useState(false);
  const [notificationAccessRequested, setNotificationAccessRequested] = useState(false);

  function requestNotificationAccess() {
    setNotificationAccessRequested(true);
    Linking.sendIntent?.('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS').catch(() => {
      Linking.openSettings();
    });
  }

  const savingsTargetPaise = Math.round((parseFloat(savingsTarget) || 0) * 100);

  const incomeTotalPaise = incomes.reduce((sum, i) => sum + i.amountPaise, 0);
  const fixedTotalPaise = fixed.reduce((sum, f) => sum + f.amountPaise, 0);
  const plannedTotalPaise = planned.reduce((sum, p) => sum + p.amountPaise, 0);
  const availableForSavingsPaise = incomeTotalPaise - fixedTotalPaise - plannedTotalPaise;

  const discretionary = discretionaryBudgetPaise({
    incomeSources: incomes.map((i) => ({
      id: '', cycleId: '', name: i.name, amountPaise: i.amountPaise, type: 'MONTHLY', status: 'RECEIVED', guaranteed: true,
    })),
    fixedExpenses: fixed.map((f) => ({
      id: '', cycleId: '', name: f.name, amountPaise: f.amountPaise, recurring: true, type: 'BILL', status: 'PLANNED',
    })),
    plannedExpenses: planned.map((p) => ({ id: '', cycleId: '', name: p.name, amountPaise: p.amountPaise, paid: false })),
    savingsTargetPaise,
  });
  async function goNext() {
    if (step === 4 && !cycle) {
      // Create the cycle (once), then persist everything collected so far.
      setCreatingCycle(true);
      try {
        const startDate = cycleMode === 'CUSTOM_DATES' ? customStartDate : firstCycleStartDateFromSalaryDay(parseInt(salaryDay, 10) || 1);
        const validCustomDates = /^\d{4}-\d{2}-\d{2}$/.test(customStartDate) && /^\d{4}-\d{2}-\d{2}$/.test(customEndDate) && new Date(customEndDate) >= new Date(customStartDate);
        if (cycleMode === 'CUSTOM_DATES' && !validCustomDates) return;
        await startFirstCycle({ startDate, endDate: cycleMode === 'CUSTOM_DATES' ? customEndDate : undefined, cycleMode, savingsTargetPaise });
        for (const i of incomes) {
          await addIncome({
            name: i.name,
            amountPaise: i.amountPaise,
            // One-time income is not carried into the next cycle.
            type: i.oneTime ? 'ONE_TIME' : 'MONTHLY',
            status: 'RECEIVED',
            guaranteed: true,
          });
        }
        for (const f of fixed) await addFixedExpense({ name: f.name, amountPaise: f.amountPaise, recurring: true, type: 'BILL' });
        for (const p of planned) await addPlannedExpense({ name: p.name, amountPaise: p.amountPaise });
      } finally {
        setCreatingCycle(false);
      }
    }
    if (step === STEPS.length - 1) {
      setOnboarded(true);
      navigation.replace('Dashboard');
      return;
    }
    setStep((s) => s + 1);
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <AmbientBackground />
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <Surface
            key={i}
            depth={i <= step ? 'flat' : 'inset'}
            size="pill"
            intensity={0.4}
            style={[styles.dot, i <= step && { backgroundColor: colors.accent }]}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
      <ScrollView contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Text style={[typography.display, { fontSize: 30, color: colors.text, marginBottom: spacing.xs }]}>{STEPS[step]}</Text>

        {step === 0 && (
          <EntryListStep
            hint1="Income is optional."
            hint2="Add salary or other income if you want a spending budget; skip this to track expenses only."
            addLabel="Add income"
            sheetTitle="Add income"
            nameLabel="Name"
            namePlaceholder="e.g. Salary, Freelance, Family"
            listLabel="income source"
            icon="briefcase"
            entries={incomes}
            setEntries={setIncomes}
            oneTimeLabel="One-time only (won't repeat next month)"
          />
        )}
        {step === 1 && (
          <EntryListStep
            hint1="Add everything you pay regularly."
            hint2="EMIs, subscriptions, bills — anything recurring."
            addLabel="Add fixed expense"
            sheetTitle="Add fixed expense"
            nameLabel="Name"
            namePlaceholder="e.g. Rent, EMI, Netflix"
            listLabel="fixed expense"
            icon="calendar"
            entries={fixed}
            setEntries={setFixed}
          />
        )}
        {step === 2 && (
          <EntryListStep
            hint1="Add expenses you're expecting this cycle."
            hint2="Happens once this cycle — won't repeat next month."
            addLabel="Add one-time expense"
            sheetTitle="Add one-time expense"
            nameLabel="Name"
            namePlaceholder="e.g. Trip, Gift, Repair"
            listLabel="one-time expense"
            icon="tag"
            entries={planned}
            setEntries={setPlanned}
          />
        )}

        {step === 3 && (
          <>
            <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>
              Set aside an amount to reach your goals. This is optional, and you can use BudgetGuard purely to track expenses.
            </Text>

            <HeroCard
              icon="piggy-bank"
              iconBg="rgba(167,139,250,0.16)"
              label="Available before savings"
              paise={availableForSavingsPaise}
              caption="Left for day to day spending or savings"
            />

            <CollapsibleCalc>
              <CalcRow icon="arrow-up" iconBg="rgba(79,190,124,0.15)" iconColor={colors.positive} title="Total income" subtitle="All your income sources" paise={incomeTotalPaise} />
              <Divider />
              <CalcRow icon="arrow-down" iconBg="rgba(255,107,99,0.15)" iconColor={colors.negative} title="Fixed + one-time expenses" subtitle="Bills, EMIs, subscriptions, etc." paise={-(fixedTotalPaise + plannedTotalPaise)} />
              <Divider />
              <CalcRow icon="equal" iconBg={colors.surfaceAlt} iconColor={colors.textMuted} title="Available before savings" subtitle="For day to day spending or savings" paise={availableForSavingsPaise} bold />
            </CollapsibleCalc>

            <Text style={[typography.title, { fontSize: 17, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
              How much do you want to save this cycle?
            </Text>
            <AmountField value={savingsTarget} onChangeText={setSavingsTarget} />

            <Surface size="tile" intensity={0.7} style={styles.tipRow}>
              <IconCircle name="wallet" size={36} bg={colors.surfaceAlt} iconSize={16} iconColor={colors.textMuted} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text
                  style={[
                    typography.body,
                    { color: availableForSavingsPaise - savingsTargetPaise < 0 ? colors.negative : colors.text, fontWeight: '600' },
                  ]}
                >
                  {availableForSavingsPaise - savingsTargetPaise < 0
                    ? `That's ₹${(Math.abs(availableForSavingsPaise - savingsTargetPaise) / 100).toLocaleString('en-IN')} more than you have available.`
                    : `₹${((availableForSavingsPaise - savingsTargetPaise) / 100).toLocaleString('en-IN')} will still be left for day to day spending.`}
                </Text>
              </View>
            </Surface>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>Choose how your main budget cycle is defined.</Text>

            <View style={styles.segment}>
              {([{ value: 'SALARY_DAY' as const, label: 'Salary day' }, { value: 'CUSTOM_DATES' as const, label: 'Custom dates' }]).map((option) => (
                <PressableSurface key={option.value} onPress={() => setCycleMode(option.value)} size="control" depth={cycleMode === option.value ? 'raised' : 'inset'} style={[styles.segmentItem, cycleMode === option.value && { backgroundColor: colors.accent }]}>
                  <Text style={{ color: cycleMode === option.value ? colors.onAccent : colors.text, fontWeight: '600' }}>{option.label}</Text>
                </PressableSurface>
              ))}
            </View>

            {cycleMode === 'CUSTOM_DATES' ? (
              <>
                <FormField label="Start date" placeholder="YYYY-MM-DD" value={customStartDate} onChangeText={setCustomStartDate} />
                <FormField label="End date" placeholder="YYYY-MM-DD" value={customEndDate} onChangeText={setCustomEndDate} />
                <Text style={[typography.caption, { color: colors.textMuted }]}>Both dates are included. The cycle closes after the end date.</Text>
              </>
            ) : null}

            {cycleMode === 'SALARY_DAY' && <>

            <Surface size="tile" intensity={0.7} style={styles.tipRow}>
              <IconCircle name="calendar" size={36} bg="rgba(96,165,250,0.15)" iconSize={16} iconColor="#60A5FA" />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>We'll use this to set your budget cycle</Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>Your monthly budget will start from this day.</Text>
              </View>
            </Surface>

            <Text style={[typography.title, { fontSize: 17, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>Select a day</Text>
            <DayPicker value={salaryDay} onChange={setSalaryDay} />

            <View style={[styles.tipRow, { borderColor: colors.border, backgroundColor: colors.surface, marginTop: spacing.lg }]}> 
              <IconCircle name="lightbulb" size={36} bg={colors.surfaceAlt} iconSize={16} iconColor={colors.textMuted} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>Not sure?</Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  Choose the day you usually receive your salary. You can always change this later from settings.
                </Text>
              </View>
            </View>
            </>}
          </>
        )}

        {step === 5 && (
          <>
            {/* Lead with the number the whole app exists to produce, not with
                the mechanism that produces it. */}
            <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>
              After bills, one-time costs and savings, this is what's left to spend.
            </Text>

            <Surface size="card" style={styles.heroCard}>
              <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 0.4 }]}>YOU CAN SPEND</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.sm }}>
                <MoneyText
                  paise={cycle ? Math.round(discretionary / cycleLengthDays(cycle)) : 0}
                  style={[typography.display, { fontSize: 40 }]}
                  tone="auto"
                />
                <Text style={[typography.body, { color: colors.textMuted, marginLeft: 6 }]}>a day</Text>
              </View>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                {`${formatRupees(discretionary)} over ${cycle ? cycleLengthDays(cycle) : 30} days. It builds up daily — spend less today and the rest carries forward.`}
              </Text>
            </Surface>

            <View style={{ marginTop: spacing.lg }}>
              <CategoryStep
                cycleId={cycle?.id}
                categories={categories}
                addCategory={addCategory}
                updateCategoryAllocation={updateCategoryAllocation}
                deleteCategory={deleteCategory}
                cycleLength={cycle ? cycleLengthDays(cycle) : 30}
              />
            </View>
          </>
        )}

        {step === 6 && cycle && (
          <HowItWorksStep categories={categories} discretionaryPaise={discretionary} cycleLength={cycleLengthDays(cycle)} />
        )}

        {step === 7 && (
          <>
            <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>
              BudgetGuard can read payment notifications to auto-detect transactions — fully on-device, nothing
              uploaded. Android requires you to switch this on from a system settings screen; tap below to
              go straight there.
            </Text>
            <Button
              title={notificationAccessRequested ? 'Opened — enable BudgetGuard in the list' : 'Enable notification access'}
              onPress={requestNotificationAccess}
              variant={notificationAccessRequested ? 'secondary' : 'primary'}
            />
          </>
        )}
      </ScrollView>

      {!keyboardVisible && (
        <View style={[styles.footer, { borderColor: colors.border, paddingBottom: spacing.lg + insets.bottom }]}>
          {step > 0 ? <Button title="Back" variant="secondary" onPress={goBack} style={styles.footerBtn} /> : <View style={styles.footerBtn} />}
          <Button
            title={step === STEPS.length - 1 ? 'Finish' : 'Continue  →'}
            onPress={goNext}
            loading={creatingCycle}
            style={styles.footerBtn}
          />
        </View>
      )}
      </KeyboardAvoidingView>
    </View>
  );
}

function IconCircle({
  name,
  size = 40,
  bg,
  iconColor = '#FFFFFF',
  iconSize,
}: {
  name: IconName;
  size?: number;
  bg: string;
  iconColor?: string;
  iconSize?: number;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={iconSize ?? Math.round(size * 0.5)} color={iconColor} />
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

function HeroCard({
  icon,
  iconBg,
  label,
  paise,
  caption,
  badge,
}: {
  icon: IconName;
  iconBg: string;
  label: string;
  paise: number;
  caption: string;
  badge?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Surface size="card" style={styles.heroCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircle name={icon} size={32} bg={iconBg} iconSize={16} iconColor={colors.text} />
            <Text style={[typography.label, { color: colors.textMuted, marginLeft: spacing.sm, letterSpacing: 0.3 }]} numberOfLines={1}>
              {label.toUpperCase()}
            </Text>
          </View>
          <MoneyText paise={paise} style={[typography.display, { fontSize: 34, marginTop: spacing.sm }]} tone={paise < 0 ? 'negative' : 'positive'} />
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>{caption}</Text>
        </View>
        {badge}
      </View>
    </Surface>
  );
}

function CalcRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  paise,
  bold,
}: {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  paise: number;
  bold?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.calcRow}>
      <IconCircle name={icon} size={32} bg={iconBg} iconSize={15} iconColor={iconColor} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={[typography.body, { color: colors.text, fontWeight: bold ? '700' : '600' }]}>{title}</Text>
        {subtitle ? <Text style={[typography.caption, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      <MoneyText paise={paise} style={[typography.body, { fontWeight: bold ? '700' : '600' }]} />
    </View>
  );
}

function CollapsibleCalc({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginTop: spacing.lg }}>
      <PressableSurface onPress={() => setOpen((o) => !o)} size="control" accessibilityLabel="How is this calculated?" style={styles.calcToggle}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>How is this calculated?</Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name="chevron-down" size={14} color={colors.textMuted} />
        </View>
      </PressableSurface>
      {open && <Surface size="card" style={[styles.card, { marginTop: spacing.sm }]}>{children}</Surface>}
    </View>
  );
}

const DAYS_IN_MONTH = Array.from({ length: 28 }, (_, i) => i + 1);
const CALENDAR_CELL_SIZE = 38;

function DayPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors } = useTheme();
  const selected = parseInt(value, 10) || 1;
  const cellWell = useDepth('inset', 0.4);
  return (
    <Surface depth="inset" size="card" intensity={0.8} style={styles.calendar}>
      {DAYS_IN_MONTH.map((day) => {
        const isSelected = day === selected;
        return (
          <Pressable
            key={day}
            onPress={() => onChange(String(day))}
            hitSlop={2}
            android_ripple={{ color: colors.border }}
            style={({ pressed }) => [
              styles.calendarCell,
              isSelected ? { backgroundColor: colors.accent } : cellWell,
              pressed && !isSelected && { opacity: 0.7 },
            ]}
          >
            <Text
              style={{
                color: isSelected ? colors.onAccent : colors.text,
                fontWeight: isSelected ? '700' : '400',
                fontSize: 15,
                // Line box == cell height is the one vertical centering that
                // behaves on Android; alignItems alone leaves the glyph low.
                lineHeight: CALENDAR_CELL_SIZE,
                width: '100%',
                textAlign: 'center',
                includeFontPadding: false,
              }}
            >
              {day}
            </Text>
          </Pressable>
        );
      })}
    </Surface>
  );
}

function EntryListStep({
  hint1,
  hint2,
  addLabel,
  sheetTitle,
  nameLabel,
  namePlaceholder,
  listLabel,
  icon,
  entries,
  setEntries,
  oneTimeLabel,
}: {
  hint1: string;
  hint2: string;
  addLabel: string;
  sheetTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  listLabel: string;
  icon: IconName;
  entries: DraftEntry[];
  setEntries: React.Dispatch<React.SetStateAction<DraftEntry[]>>;
  /** When set, the sheet offers a one-time toggle with this label. */
  oneTimeLabel?: string;
}) {
  const { colors } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [oneTime, setOneTime] = useState(false);
  const total = entries.reduce((sum, e) => sum + e.amountPaise, 0);

  function openAdd() {
    setEditingIndex(null);
    setName('');
    setAmount('');
    setOneTime(false);
    setSheetOpen(true);
  }

  function openEdit(i: number) {
    setEditingIndex(i);
    setName(entries[i].name);
    setAmount(String(entries[i].amountPaise / 100));
    setOneTime(entries[i].oneTime ?? false);
    setSheetOpen(true);
  }

  function save() {
    if (!name.trim() || !amount) return;
    const entry: DraftEntry = {
      name: name.trim(),
      amountPaise: Math.round(parseFloat(amount) * 100),
      ...(oneTimeLabel ? { oneTime } : {}),
    };
    if (editingIndex !== null) {
      setEntries((list) => list.map((e, idx) => (idx === editingIndex ? entry : e)));
    } else {
      setEntries((e) => [...e, entry]);
    }
    setName('');
    setAmount('');
    setSheetOpen(false);
  }

  return (
    <View>
      <Text style={[typography.body, { color: colors.textMuted, marginBottom: 2 }]}>{hint1}</Text>
      <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>{hint2}</Text>

      <PressableSurface onPress={openAdd} size="control" accessibilityLabel={addLabel} style={styles.addPill}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={16} color={colors.onAccent} />
        </View>
        <Text style={[typography.body, { color: colors.text, fontWeight: '700', marginLeft: spacing.md }]}>{addLabel}</Text>
      </PressableSurface>

      {entries.length > 0 && (
        <>
          <View style={[styles.listHeaderRow, { marginTop: spacing.xl }]}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
              Your {listLabel}
              {listLabel.endsWith('s') ? '' : entries.length === 1 ? '' : 's'} ({entries.length})
            </Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>Total</Text>
              <MoneyText paise={total} style={[typography.body, { fontWeight: '700' }]} />
            </View>
          </View>

          {entries.map((e, i) => (
            <Surface key={i} size="tile" intensity={0.7} style={styles.listItem}>
              <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => openEdit(i)} hitSlop={4}>
                <IconCircle name={icon} size={36} bg={colors.surfaceAlt} iconSize={16} iconColor={colors.text} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{e.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MoneyText paise={e.amountPaise} style={typography.caption} />
                    {e.oneTime ? (
                      <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 6 }]}>· one-time</Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
              <IconButton
                glyph="−"
                color={colors.negative}
                accessibilityLabel={`Remove ${e.name}`}
                onPress={() => setEntries((list) => list.filter((_, idx) => idx !== i))}
              />
            </Surface>
          ))}
        </>
      )}

      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <KeyboardAvoidingView
          style={styles.sheetBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetOpen(false)} />
          <Surface size="card" style={styles.sheet}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[typography.title, { fontSize: 22, color: colors.text, marginBottom: spacing.lg }]}>
              {editingIndex !== null ? `Edit ${nameLabel === 'Name' ? listLabel : nameLabel}` : sheetTitle}
            </Text>
            <FormField label={nameLabel} value={name} onChangeText={setName} placeholder={namePlaceholder} autoFocus />
            <AmountField value={amount} onChangeText={setAmount} />
            {oneTimeLabel ? (
              <PressableSurface
                onPress={() => setOneTime((v) => !v)}
                depth={oneTime ? 'raised' : 'inset'}
                size="control"
                accessibilityLabel={oneTimeLabel}
                style={[styles.oneTimeRow, oneTime && { backgroundColor: colors.accent }]}
              >
                <Icon name={oneTime ? 'sparkle' : 'calendar'} size={15} color={oneTime ? colors.onAccent : colors.textMuted} />
                <Text
                  style={[
                    typography.caption,
                    { color: oneTime ? colors.onAccent : colors.textMuted, marginLeft: spacing.sm, flex: 1 },
                  ]}
                >
                  {oneTimeLabel}
                </Text>
              </PressableSurface>
            ) : null}
            <View style={styles.sheetActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setSheetOpen(false)} style={styles.footerBtn} />
              <Button title={editingIndex !== null ? 'Save' : 'Add'} onPress={save} disabled={!name.trim() || !amount} style={styles.footerBtn} />
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function CategoryStep({
  cycleId,
  categories,
  addCategory,
  updateCategoryAllocation,
  deleteCategory,
  cycleLength,
}: {
  cycleId?: string;
  categories: { id: string; name: string; allocatedPaise: number }[];
  addCategory: (name: string, paise: number) => Promise<void>;
  updateCategoryAllocation: (id: string, paise: number) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  cycleLength: number;
}) {
  const { colors } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [editing, setEditing] = useState<Record<string, string>>({});

  async function add() {
    if (!name.trim() || !cycleId) return;
    await addCategory(name.trim(), Math.round((parseFloat(amount) || 0) * 100));
    setName('');
    setAmount('');
    setSheetOpen(false);
  }

  async function commit(id: string) {
    const value = editing[id];
    if (value === undefined) return;
    await updateCategoryAllocation(id, Math.round((parseFloat(value) || 0) * 100));
    setEditing((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });
  }

  return (
    <View>
      <View style={{ marginBottom: spacing.sm }}>
        <View style={styles.listHeaderRow}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>Set limits per thing</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>Optional</Text>
        </View>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          Give one thing its own daily share — say ₹100 a day for food. Everything you don't split stays in
          Others, so you can skip this and add categories later.
        </Text>
      </View>

      {categories.length === 0 ? (
        <Surface depth="inset" size="tile" style={styles.emptyCard}>
          <Icon name="inbox" size={28} color={colors.textMuted} />
          <Text style={[typography.body, { color: colors.text, fontWeight: '700', marginTop: spacing.sm }]}>No limits set</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2, textAlign: 'center' }]}>
            That's fine — the whole amount stays in Others and you can spend it on anything.
          </Text>
        </Surface>
      ) : (
        categories.map((c) => (
          <Surface key={c.id} size="tile" intensity={0.7} style={styles.listItem}>
            <IconCircle name={categoryIconFor(c.name)} size={36} bg={colors.surfaceAlt} iconSize={16} iconColor={colors.text} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{c.name}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {`${formatRupees(Math.round(c.allocatedPaise / cycleLength))} a day`}
              </Text>
            </View>
            {c.name === OTHERS_CATEGORY_NAME ? (
              <MoneyText paise={c.allocatedPaise} tone={c.allocatedPaise < 0 ? 'negative' : 'neutral'} style={typography.body} />
            ) : (
              <>
                <View style={[styles.amountBox, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.textMuted, marginRight: 2 }}>₹</Text>
                  <TextInput
                    value={editing[c.id] ?? String(c.allocatedPaise / 100)}
                    onChangeText={(v) => setEditing((e) => ({ ...e, [c.id]: v.replace(/[^0-9]/g, '') }))}
                    onBlur={() => commit(c.id)}
                    keyboardType="number-pad"
                    style={{ color: colors.text, minWidth: 50, textAlign: 'right', padding: 0 }}
                  />
                </View>
                <IconButton
                  glyph="−"
                  color={colors.negative}
                  accessibilityLabel={`Remove ${c.name}`}
                  onPress={() => deleteCategory(c.id)}
                />
              </>
            )}
          </Surface>
        ))
      )}

      <Pressable
        onPress={() => setSheetOpen(true)}
        hitSlop={4}
        android_ripple={{ color: colors.border }}
        style={({ pressed }) => [
          styles.addPill,
          { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1, marginTop: spacing.sm },
        ]}
      >
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={16} color={colors.onAccent} />
        </View>
        <Text style={[typography.body, { color: colors.text, fontWeight: '700', marginLeft: spacing.md }]}>Add a category</Text>
      </Pressable>

      <View style={[styles.tipRow, { borderColor: colors.border, backgroundColor: colors.surface, marginTop: spacing.md }]}>
        <IconCircle name="dots" size={36} bg={colors.surfaceAlt} iconSize={16} iconColor={colors.textMuted} />
        <Text style={[typography.caption, { color: colors.textMuted, flex: 1, marginLeft: spacing.sm }]}>
          Others is everything else. It shrinks as you add categories, and you can change all of this later.
        </Text>
      </View>

      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <KeyboardAvoidingView style={styles.sheetBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetOpen(false)} />
          <Surface size="card" style={styles.sheet}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[typography.title, { fontSize: 22, color: colors.text, marginBottom: spacing.lg }]}>Add a category</Text>
            <FormField label="Category name" value={name} onChangeText={setName} placeholder="e.g. Fuel, Food, Shopping" autoFocus />
            <AmountField value={amount} onChangeText={setAmount} label="Amount for the whole month" />
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
              {amount
                ? `That's ${formatRupees(Math.round((parseFloat(amount) || 0) * 100 / cycleLength))} a day for ${name.trim() || 'this category'}.`
                : 'You will see the daily amount as you type.'}
            </Text>
            <View style={styles.sheetActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setSheetOpen(false)} style={styles.footerBtn} />
              <Button title="Add" onPress={add} disabled={!name.trim()} style={styles.footerBtn} />
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function HowItWorksStep({
  categories,
  discretionaryPaise,
  cycleLength,
}: {
  categories: { id: string; name: string; allocatedPaise: number }[];
  discretionaryPaise: number;
  cycleLength: number;
}) {
  const { colors } = useTheme();
  const funded = categories.filter((c) => c.allocatedPaise > 0);
  const categoryTotal = categories.reduce((sum, c) => sum + c.allocatedPaise, 0);
  // Fall back to the discretionary total worked out from income/expenses/savings
  // so this step is useful even before the user has allocated individual categories.
  const exampleTotal = categoryTotal > 0 ? categoryTotal : Math.max(0, discretionaryPaise);
  const usingFallback = categoryTotal === 0 && exampleTotal > 0;
  const day1 = accruedAllowancePaise(exampleTotal, 1, cycleLength);
  const midDay = Math.ceil(cycleLength / 2);
  const midTotal = accruedAllowancePaise(exampleTotal, midDay, cycleLength);

  return (
    <View>
      <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>
        Your budget doesn't unlock all at once — it builds up day by day over your {cycleLength}-day
        cycle, so you can't blow it all on day one. Spend less than your daily share and the unused
        amount rolls forward and stays available.
      </Text>

      <View style={[styles.tipRow, { borderColor: colors.border, backgroundColor: colors.surface, marginBottom: spacing.lg }]}>
        <IconCircle name="bar-chart" size={36} bg={colors.surfaceAlt} iconSize={16} iconColor={colors.text} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>A fairer way to budget</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
            Instead of giving you the full amount on day one, we release your budget gradually each day.
          </Text>
        </View>
      </View>

      {exampleTotal > 0 ? (
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface, marginBottom: spacing.lg }]}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>Budget build-up (example)</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2, marginBottom: spacing.lg }]}>
            {usingFallback
              ? `If you've budgeted ₹${(exampleTotal / 100).toLocaleString('en-IN')} for spending this cycle.`
              : 'Based on what you’ve budgeted.'}
          </Text>
          <View style={styles.timelineRow}>
            <TimelineStop label={`Day 1`} paise={day1} caption="Available on day 1" />
            <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
            <TimelineStop label={`Day ${midDay}`} paise={midTotal} caption={`Available by day ${midDay}`} />
            <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
            <TimelineStop label={`Day ${cycleLength}`} paise={exampleTotal} caption={`Full amount by day ${cycleLength}`} />
          </View>
        </View>
      ) : (
        <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>
          You haven't budgeted anything yet, so there's nothing to accrue — go back and set a budget
          for at least one category (Others works fine) to see the numbers.
        </Text>
      )}

      {funded.length > 0 && (
        <>
          <Text style={[typography.title, { fontSize: 17, color: colors.text, marginBottom: 2 }]}>Per category, per day</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>This is your daily share for each category.</Text>
          {funded.map((c) => (
            <Surface key={c.id} size="tile" intensity={0.7} style={styles.listItem}>
              <IconCircle name={categoryIconFor(c.name)} size={36} bg={colors.surfaceAlt} iconSize={16} iconColor={colors.text} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{c.name}</Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>You can spend up to this amount each day</Text>
              </View>
              <MoneyText paise={Math.round(c.allocatedPaise / cycleLength)} style={[typography.body, { fontWeight: '700' }]} />
              <Text style={{ color: colors.textMuted, marginLeft: 4 }}>/day</Text>
            </Surface>
          ))}
        </>
      )}

      <Surface size="tile" intensity={0.7} style={[styles.tipRow, { marginTop: spacing.md }]}>
        <IconCircle name="lightbulb" size={36} bg={colors.surfaceAlt} iconSize={16} iconColor={colors.textMuted} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>Unused amount rolls forward</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
            If you spend less than your daily share, the remaining amount stays available for later in the month.
          </Text>
        </View>
      </Surface>
    </View>
  );
}

function TimelineStop({ label, paise, caption }: { label: string; paise: number; caption: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>{label}</Text>
      <View style={[styles.timelineDot, { borderColor: colors.textMuted }]} />
      <View style={[styles.timelineBadge, { backgroundColor: colors.surfaceAlt }]}>
        <MoneyText paise={paise} style={[typography.body, { fontWeight: '700' }]} />
      </View>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }]} numberOfLines={2}>
        {caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoider: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  card: {
    padding: spacing.lg,
  },
  heroCard: {
    padding: spacing.lg,
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  calcToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    maxWidth: 120,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.xs,
  },
  calendarCell: {
    width: '12.6%',
    height: CALENDAR_CELL_SIZE,
    borderRadius: CALENDAR_CELL_SIZE / 2,
    overflow: 'hidden',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  oneTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  footerBtn: {
    flex: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLine: {
    height: StyleSheet.hairlineWidth,
    flex: 0.4,
    marginTop: 20,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  timelineBadge: {
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  segment: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
