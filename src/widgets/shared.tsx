import React from 'react';
import { format } from 'date-fns';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import { formatRupees } from '../components/MoneyText';
import { PLUS_ICON, REFRESH_ICON, categoryIconFor } from './icons';
import { statusColor } from '../budget/categoryStatus';

/** Deep links, matching RootNavigator's linking config. */
export const LINKS = {
  dashboard: 'budgetguard://dashboard',
  categories: 'budgetguard://categories',
  transactions: 'budgetguard://transactions',
  addTransaction: 'budgetguard://add-transaction',
} as const;

/**
 * Monochrome shell on true black — opaque so it stays legible over any
 * wallpaper — with hue spent only on spend status and the direction of money.
 */
export const colors = {
  background: '#000000',
  card: '#141414',
  raised: '#0E0E0E',
  track: '#242424',
  border: '#242424',
  text: '#FFFFFF',
  muted: '#9E9E9E',
  green: '#3DDC84',
  greenBadgeBg: '#0F2A1B',
  negative: '#FF6B63',
  warning: '#F5C24C',
} as const;

/**
 * Measured from the layout: a category row is the 22dp icon plus the bar
 * (5 margin + 4) plus a 7dp gap; a compact transaction row is the icon plus its
 * 8dp gap.
 */
export const CATEGORY_ROW = 38;
export const TX_ROW_COMPACT = 30;
export const TX_ROW_FULL = 38;
/** Shell padding (14 + 14) + header (24) + the 8dp gap under it. */
export const BASE_CHROME = 56;

/** How many rows fit the height the launcher actually gave us. */
export function rowsThatFit(heightDp: number | undefined, rowHeight: number, chrome: number, fallback: number): number {
  if (!heightDp) return fallback;
  return Math.max(1, Math.min(10, Math.floor((heightDp - chrome) / rowHeight)));
}

/** Re-exported so widgets colour bars the same way the app does. */
export function statusColorFor(spentPaise: number, accruedPaise: number): `#${string}` {
  return statusColor(spentPaise, accruedPaise);
}

export function WidgetShell({ children }: { children: React.ReactNode }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.background,
        borderRadius: 26,
        padding: 14,
        flexDirection: 'column',
      }}
    >
      {children}
    </FlexWidget>
  );
}

export function RefreshButton() {
  return (
    <FlexWidget
      style={{ width: 26, height: 26, borderRadius: 13, marginLeft: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}
      clickAction="REFRESH"
      accessibilityLabel="Refresh"
    >
      <SvgWidget svg={REFRESH_ICON(colors.muted)} style={{ width: 12, height: 12 }} />
    </FlexWidget>
  );
}

/** Title opens the app; the refresh button beside it keeps its own action. */
export function WidgetHeader({
  title,
  updatedAt,
  children,
  clickUri = LINKS.dashboard,
}: {
  title: string;
  updatedAt: number;
  children?: React.ReactNode;
  clickUri?: string;
}) {
  return (
    <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 'match_parent' }}>
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }} clickAction="OPEN_URI" clickActionData={{ uri: clickUri }}>
        <TextWidget text={title} style={{ fontSize: 10, color: colors.muted }} />
        {children}
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextWidget text={format(updatedAt, 'h:mm a')} style={{ fontSize: 11, color: colors.muted }} />
        <RefreshButton />
      </FlexWidget>
    </FlexWidget>
  );
}

/** A flex:1 gap that soaks up leftover height instead of leaving a void. */
export function Spacer() {
  return <FlexWidget style={{ flex: 1, width: 'match_parent' }} />;
}

export function ProgressBar({ ratio, color }: { ratio: number; color: `#${string}` }) {
  // The native side reads flex with getInt (BaseWidget.java), so fractional
  // weights truncate to 0 and the bar never fills — keep them whole numbers.
  const filledWeight = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return (
    <FlexWidget
      style={{ flexDirection: 'row', height: 4, borderRadius: 2, backgroundColor: colors.track, width: 'match_parent', marginTop: 5, overflow: 'hidden' }}
    >
      <FlexWidget style={{ flex: filledWeight, height: 4, backgroundColor: filledWeight > 0 ? color : colors.track, borderRadius: 3 }} />
      <FlexWidget style={{ flex: 100 - filledWeight, height: 4, backgroundColor: 'rgba(0, 0, 0, 0)' }} />
    </FlexWidget>
  );
}

export function CategoryRow({
  name,
  spentPaise,
  accruedPaise,
  color,
}: {
  name: string;
  spentPaise: number;
  accruedPaise: number;
  /** Defaults to the spend-status tone so widgets match the app. */
  color?: `#${string}`;
}) {
  const ratio = accruedPaise > 0 ? spentPaise / accruedPaise : 0;
  const barColor = color ?? statusColor(spentPaise, accruedPaise);
  return (
    <FlexWidget
      style={{ flexDirection: 'column', marginBottom: 7, width: 'match_parent' }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: LINKS.categories }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 'match_parent' }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FlexWidget style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <SvgWidget svg={categoryIconFor(name)} style={{ width: 12, height: 12 }} />
          </FlexWidget>
          <TextWidget text={name} style={{ fontSize: 12, fontWeight: '600', color: colors.text, marginLeft: 7 }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text={formatRupees(spentPaise)} style={{ fontSize: 12, fontWeight: '600', color: colors.text }} />
          <TextWidget text={` / ${formatRupees(accruedPaise)}`} style={{ fontSize: 12, color: colors.muted }} />
        </FlexWidget>
      </FlexWidget>
      <ProgressBar ratio={ratio} color={barColor} />
    </FlexWidget>
  );
}

/**
 * Grid form of a category: icon and name on top, spend under it, bar across the
 * bottom. Two sit side by side, so the label must stay short.
 */
export function CategoryCard({
  name,
  spentPaise,
  accruedPaise,
  last,
}: {
  name: string;
  spentPaise: number;
  accruedPaise: number;
  last?: boolean;
}) {
  const ratio = accruedPaise > 0 ? spentPaise / accruedPaise : 0;
  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: 'column',
        backgroundColor: colors.raised,
        borderRadius: 14,
        padding: 8,
        marginRight: last ? 0 : 8,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: LINKS.categories }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
        <FlexWidget style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <SvgWidget svg={categoryIconFor(name)} style={{ width: 12, height: 12 }} />
        </FlexWidget>
        <TextWidget text={name} style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginLeft: 6 }} />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <TextWidget text={formatRupees(spentPaise)} style={{ fontSize: 12, fontWeight: '700', color: colors.text }} />
        <TextWidget text={` / ${formatRupees(accruedPaise)}`} style={{ fontSize: 12, color: colors.muted }} />
      </FlexWidget>
      <ProgressBar ratio={ratio} color={statusColor(spentPaise, accruedPaise)} />
    </FlexWidget>
  );
}

/** The combined line the app leads with, above the per-category rows. */
export function OverallRow({ spentPaise, accruedPaise }: { spentPaise: number; accruedPaise: number }) {
  const availablePaise = accruedPaise - spentPaise;
  return (
    <FlexWidget
      style={{ flexDirection: 'column', marginBottom: 10, width: 'match_parent' }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: LINKS.dashboard }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 'match_parent' }}>
        <TextWidget text="Today's Remaining Budget" style={{ fontSize: 11, color: colors.muted }} />
        <TextWidget text={formatRupees(availablePaise)} style={{ fontSize: 15, fontWeight: '700', color: colors.text }} />
      </FlexWidget>
      <ProgressBar ratio={accruedPaise > 0 ? spentPaise / accruedPaise : 0} color={statusColor(spentPaise, accruedPaise)} />
    </FlexWidget>
  );
}

export function TransactionRow({
  title,
  categoryName,
  amountPaise,
  timestamp,
  compact,
}: {
  title: string;
  categoryName: string;
  amountPaise: number;
  timestamp: number;
  /** Category and amount only — for the narrow column in the combined widget. */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <FlexWidget
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 'match_parent', marginBottom: 8 }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: LINKS.transactions }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FlexWidget style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <SvgWidget svg={categoryIconFor(categoryName)} style={{ width: 11, height: 11 }} />
          </FlexWidget>
          <TextWidget text={categoryName} style={{ fontSize: 12, fontWeight: '600', color: colors.text, marginLeft: 6 }} />
        </FlexWidget>
        <TextWidget text={`-${formatRupees(amountPaise)}`} style={{ fontSize: 12, fontWeight: '700', color: colors.text }} />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 'match_parent', marginBottom: 8 }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: LINKS.transactions }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <FlexWidget style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <SvgWidget svg={categoryIconFor(categoryName)} style={{ width: 13, height: 13 }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', marginLeft: 8 }}>
          <TextWidget text={title} style={{ fontSize: 13, fontWeight: '600', color: colors.text }} />
          <TextWidget text={categoryName} style={{ fontSize: 11, color: colors.muted }} />
        </FlexWidget>
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
        <TextWidget text={`-${formatRupees(amountPaise)}`} style={{ fontSize: 13, fontWeight: '600', color: colors.text }} />
        <TextWidget text={format(timestamp, 'h:mm a')} style={{ fontSize: 10, color: colors.muted }} />
      </FlexWidget>
    </FlexWidget>
  );
}

export function AddTransactionButton({ compact }: { compact?: boolean }) {
  return (
    <FlexWidget
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.text, borderRadius: 16, padding: compact ? 10 : 12, width: 'match_parent' }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: LINKS.addTransaction }}
      accessibilityLabel="Add transaction"
    >
      <FlexWidget
        style={{ width: compact ? 28 : 32, height: compact ? 28 : 32, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}
      >
        <SvgWidget svg={PLUS_ICON(colors.text)} style={{ width: 14, height: 14 }} />
      </FlexWidget>
      <TextWidget text="Add Transaction" style={{ fontSize: 13, fontWeight: '700', color: colors.background, marginLeft: 10 }} />
    </FlexWidget>
  );
}

export function EmptyLine({ text }: { text: string }) {
  return <TextWidget text={text} style={{ fontSize: 13, color: colors.muted, marginTop: 10 }} />;
}
