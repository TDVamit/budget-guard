import React, { useCallback, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useTheme } from '../../app/theme/ThemeProvider';
import { spacing, typography } from '../../app/theme/theme';
import { Screen } from '../../components/Screen';
import { Surface, PressableSurface } from '../../components/Surface';
import { Entrance } from '../../app/motion/animations';
import { SectionHeader } from '../../components/SectionHeader';
import { useSettingsStore } from '../../store/settingsStore';
import type { ThemeMode } from '../../models/types';
import { getDetectionDiagnostics, type DetectionDiagnostics } from '../../native/localNotification';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const [diagnostics, setDiagnostics] = useState<DetectionDiagnostics | null>(null);

  useFocusEffect(
    useCallback(() => {
      getDetectionDiagnostics().then(setDiagnostics);
    }, []),
  );

  function openNotificationAccess() {
    Linking.sendIntent?.('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS').catch(() => {
      Linking.openSettings();
    });
  }

  return (
    <Screen>
      <SectionHeader title="Theme" />
      <Entrance index={0}>
        <View style={styles.segment}>
          {THEME_OPTIONS.map((opt) => (
            // The chosen mode is the raised control; the others sit recessed.
            <PressableSurface
              key={opt.value}
              onPress={() => setThemeMode(opt.value)}
              depth={themeMode === opt.value ? 'raised' : 'inset'}
              size="control"
              accessibilityLabel={opt.label}
              style={[styles.segmentItem, themeMode === opt.value && { backgroundColor: colors.accent }]}
            >
              <Text style={{ color: themeMode === opt.value ? colors.onAccent : colors.text, fontWeight: '500' }}>
                {opt.label}
              </Text>
            </PressableSurface>
          ))}
        </View>
      </Entrance>

      <SectionHeader title="Automatic detection" />
      <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.md }]}>
        BudgetGuard can read payment notifications to detect transactions automatically. Everything is
        processed on your device — raw notification text is never uploaded anywhere.
      </Text>
      <SettingsRow label="Notification access" hint="Open settings ›" onPress={openNotificationAccess} />
      <SettingsRow label="Review detected transactions" onPress={() => navigation.navigate('AutoDetection')} />

      {diagnostics && (
        <Surface size="tile" style={styles.diagnostics}>
          <DiagnosticRow
            label="Notification access"
            value={diagnostics.listenerEnabled ? 'On' : 'Off — tap above to enable'}
            tone={diagnostics.listenerEnabled ? 'ok' : 'bad'}
          />
          <DiagnosticRow label="Transactions detected" value={String(diagnostics.addedCount)} />
        </Surface>
      )}

      <SectionHeader title="Budget" />
      <SettingsRow label="Income, expenses & categories" onPress={() => navigation.navigate('BudgetSetup')} />

      <SectionHeader title="Privacy" />
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        All data stays on this device. Nothing is uploaded to a server. BudgetGuard works fully offline.
      </Text>
    </Screen>
  );
}

function SettingsRow({ label, hint, onPress }: { label: string; hint?: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableSurface onPress={onPress} size="tile" accessibilityLabel={label} style={styles.row}>
      <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
      <Text style={{ color: colors.textMuted }}>{hint ?? '›'}</Text>
    </PressableSurface>
  );
}

function DiagnosticRow({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'bad' }) {
  const { colors } = useTheme();
  const color = tone === 'bad' ? colors.negative : tone === 'ok' ? colors.positive : colors.text;
  return (
    <View style={styles.diagnosticRow}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.caption, { color, flex: 1, textAlign: 'right', marginLeft: spacing.sm }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  diagnostics: {
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  diagnosticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  segment: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
