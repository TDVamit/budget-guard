import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { spacing, typography } from '../../app/theme/theme';
import { Screen } from '../../components/Screen';
import { Surface, PressableSurface } from '../../components/Surface';
import { Entrance } from '../../app/motion/animations';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { MoneyText } from '../../components/MoneyText';
import { Button } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { Icon } from '../../components/Icon';
import {
  getDefaultWatchedPackages,
  getInstalledApps,
  setWatchedPackages,
  type InstalledApp,
} from '../../native/localNotification';
import { useBudgetStore } from '../../store/budgetStore';
import { useSettingsStore } from '../../store/settingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'AutoDetection'>;

export function AutoDetectionScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const deleteTransaction = useBudgetStore((s) => s.deleteTransaction);
  const enabledSources = useSettingsStore((s) => s.enabledNotificationSources);
  const setEnabledSources = useSettingsStore((s) => s.setEnabledNotificationSources);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [defaults, setDefaults] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const pending = useMemo(
    () => transactions.filter((t) => !t.autoConfirmed && t.source !== 'MANUAL'),
    [transactions],
  );

  // The watch list lives in native storage as well, because the listener runs
  // with no JS runtime and reads it directly.
  useEffect(() => {
    getInstalledApps().then(setInstalledApps);
    getDefaultWatchedPackages().then(setDefaults);
  }, []);

  const watched = enabledSources.length > 0 ? enabledSources : defaults;

  function toggleSource(packageName: string, on: boolean) {
    const next = on
      ? Array.from(new Set([...watched, packageName]))
      : watched.filter((p) => p !== packageName);
    setEnabledSources(next);
    setWatchedPackages(next);
  }

  const labelFor = (packageName: string) =>
    installedApps.find((a) => a.packageName === packageName)?.label ?? packageName;

  const watchedList = watched.map((packageName) => ({ packageName, label: labelFor(packageName) }));
  const query = search.trim().toLowerCase();
  const addable = installedApps
    .filter((a) => !watched.includes(a.packageName))
    .filter((a) => (query ? a.label.toLowerCase().includes(query) || a.packageName.includes(query) : false))
    .slice(0, 12);

  return (
    <Screen>
      <SectionHeader title="Needs review" />
      {pending.length === 0 ? (
        <EmptyState title="Nothing to review" subtitle="Detected transactions with lower confidence will show up here." />
      ) : (
        pending.map((t, i) => {
          const category = categories.find((c) => c.id === t.categoryId);
          return (
            <Entrance key={t.id} index={Math.min(i, 6)}>
            <Surface size="card" style={styles.card}>
              <Text style={[typography.body, { color: colors.text }]}>{t.merchant || 'Unknown merchant'}</Text>
              <MoneyText paise={t.amountPaise} style={[typography.title, { marginTop: 4 }]} tone="negative" />
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                {t.direction} · Source: {t.sourcePackage || t.source} · Category: {category?.name ?? 'Others'}
              </Text>
              <View style={styles.actions}>
                <Button title="Confirm" onPress={() => updateTransaction(t.id, { autoConfirmed: true })} style={styles.actionBtn} />
                <Button
                  title="Edit"
                  variant="secondary"
                  onPress={() => navigation.navigate('AddTransaction', { transactionId: t.id })}
                  style={styles.actionBtn}
                />
                <Button title="Ignore" variant="destructive" onPress={() => deleteTransaction(t.id)} style={styles.actionBtn} />
              </View>
            </Surface>
            </Entrance>
          );
        })
      )}

      <SectionHeader title="Watched apps" />
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
        Only these apps are scanned for transactions. Everything is read on this device.
      </Text>
      <Surface size="card" style={styles.sourceList}>
        {watchedList.map((source, i) => (
          <View
            key={source.packageName}
            style={[styles.sourceRow, { borderColor: colors.border }, i === watchedList.length - 1 && styles.lastSourceRow]}
          >
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={[typography.body, { color: colors.text }]} numberOfLines={1}>
                {source.label}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                {source.packageName}
              </Text>
            </View>
            <Switch
              value
              onValueChange={(v) => toggleSource(source.packageName, v)}
              trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
            />
          </View>
        ))}
      </Surface>

      <SectionHeader title="Add an app" />
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
        Any app on this phone can be watched — search for your bank or wallet.
      </Text>
      <FormField label="Search apps" placeholder="e.g. ICICI, Slice, Gmail" value={search} onChangeText={setSearch} />
      {query.length > 0 && (
        <Surface size="card" style={styles.sourceList}>
          {addable.length === 0 ? (
            <Text style={[typography.caption, { color: colors.textMuted, padding: spacing.md }]}>
              No matching app found on this device.
            </Text>
          ) : (
            addable.map((app, i) => (
              <PressableSurface
                key={app.packageName}
                depth="flat"
                size="sm"
                onPress={() => {
                  toggleSource(app.packageName, true);
                  setSearch('');
                }}
                accessibilityLabel={`Watch ${app.label}`}
                style={[styles.sourceRow, { borderColor: colors.border }, i === addable.length - 1 && styles.lastSourceRow]}
              >
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <Text style={[typography.body, { color: colors.text }]} numberOfLines={1}>
                    {app.label}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                    {app.packageName}
                  </Text>
                </View>
                <Icon name="plus" size={16} color={colors.text} />
              </PressableSurface>
            ))
          )}
        </Surface>
      )}

    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    minHeight: 40,
  },
  sourceList: {
    paddingHorizontal: spacing.lg,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastSourceRow: {
    borderBottomWidth: 0,
  },
});
