import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '../app/theme/ThemeProvider';
import { useCountUp } from '../app/motion/animations';

/** Formats integer paise as ₹ rupees. Never uses floating point for the underlying value. */
export function formatRupees(paise: number): string {
  const negative = paise < 0;
  const rupees = Math.trunc(Math.abs(paise) / 100);
  const formatted = rupees.toLocaleString('en-IN');
  return `${negative ? '-' : ''}₹${formatted}`;
}

/**
 * Short form for tight cells (a calendar day is ~30dp wide): ₹7,732 → ₹7.7k.
 * Full precision stays wherever there is room for it.
 */
export function formatRupeesCompact(paise: number): string {
  const negative = paise < 0;
  const rupees = Math.trunc(Math.abs(paise) / 100);
  const sign = negative ? '-' : '';
  if (rupees < 1000) return `${sign}₹${rupees}`;
  if (rupees < 100000) {
    const k = rupees / 1000;
    return `${sign}₹${k < 10 ? k.toFixed(1).replace(/\.0$/, '') : Math.round(k)}k`;
  }
  const l = rupees / 100000;
  return `${sign}₹${l < 10 ? l.toFixed(1).replace(/\.0$/, '') : Math.round(l)}L`;
}

export function MoneyText({
  paise,
  style,
  tone = 'auto',
  animate = false,
}: {
  paise: number;
  style?: TextStyle | TextStyle[];
  tone?: 'auto' | 'neutral' | 'positive' | 'negative';
  /** Count to the value instead of swapping it — for headline figures only. */
  animate?: boolean;
}) {
  const { colors } = useTheme();
  const counted = useCountUp(animate ? paise : 0);
  const shown = animate ? counted : paise;
  const resolvedTone = tone === 'auto' ? (paise < 0 ? 'negative' : 'neutral') : tone;
  const color = resolvedTone === 'negative' ? colors.negative : resolvedTone === 'positive' ? colors.positive : colors.text;
  return (
    <Text style={[{ color, fontVariant: ['tabular-nums'] }, style]}>{formatRupees(shown)}</Text>
  );
}
