import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from '../models/types';
import { formatRupees, formatRupeesCompact } from '../components/MoneyText';
import { LINKS, WidgetHeader, WidgetShell, colors } from './shared';

// The library reads 8-digit hex as #RRGGBBAA (not #AARRGGBB): an alpha-first
// literal here rendered green as purple.
// Tinted days, hex as #RRGGBBAA (the widget library reads alpha last).
const UNDER = '#3DDC842E' as const;
const OVER = '#FF6B6333' as const;

const PER_ROW = 6;
const SHELL_PADDING = 14;
const GAP = 4;
/** Shell padding and header, without the summary card. */
const BASE_CHROME = 70;
/** The summary card and its margin, when there is room for it. */
const SUMMARY_H = 80;

/**
 * Month-to-date result on top, then a square per day: green under the day's
 * share, red over it. Cells are given an explicit width because the widget's
 * flex weight distributes only *spare* space, so cells with an amount inside
 * came out wider than empty ones.
 */
export function CalendarWidget({
  snapshot,
  widthDp,
  heightDp,
}: {
  snapshot: WidgetSnapshot;
  widthDp?: number;
  heightDp?: number;
}) {
  const days = snapshot.days;
  const past = days.filter((d) => !d.isFuture);
  const under = past.filter((d) => d.savedPaise > 0).length;
  const over = past.filter((d) => d.savedPaise < 0).length;
  const perDay = days.length > 0 ? Math.round(snapshot.totalCategoryBudgetPaise / days.length) : 0;
  const saved = snapshot.monthlySavedFromDailyBudgetsPaise;

  const rows: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += PER_ROW) rows.push(days.slice(i, i + PER_ROW));

  // The cycle is a fixed number of days, so the grid must shrink to fit rather
  // than run past the bottom edge: size the cell by width AND by the height
  // left after the header and summary.
  const availableWidth = (widthDp ?? 250) - SHELL_PADDING * 2;
  const cellFromWidth = Math.floor((availableWidth - GAP * (PER_ROW - 1)) / PER_ROW);
  // The grid is the point of this widget: when height runs short the summary
  // card goes rather than the last week of the month.
  // 260dp is where the summary plus five weeks of legible cells both fit.
  const showSummary = (heightDp ?? 280) >= 260;
  const availableHeight = (heightDp ?? 260) - BASE_CHROME - (showSummary ? SUMMARY_H : 0);
  const cellFromHeight = Math.floor(availableHeight / Math.max(1, rows.length)) - GAP;
  const cell = Math.max(16, Math.min(cellFromWidth, cellFromHeight));
  // Below this the day number alone fills the square; an amount would overflow.
  const showAmounts = cell >= 30;

  return (
    <WidgetShell>
      <WidgetHeader title="DAILY PACE" updatedAt={snapshot.updatedAt} />
      <FlexWidget style={{ height: 8 }} />

      {showSummary && (
      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          backgroundColor: colors.raised,
          borderRadius: 16,
          padding: 12,
          marginBottom: 10,
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: LINKS.dashboard }}
      >
        <TextWidget text="REMAINING THIS MONTH" style={{ fontSize: 10, color: colors.muted }} />
        <TextWidget
          text={formatRupees(saved)}
          style={{ fontSize: 24, fontWeight: '700', color: saved < 0 ? colors.negative : colors.green, marginTop: 1 }}
        />
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <TextWidget text={`${under} under`} style={{ fontSize: 11, fontWeight: '700', color: colors.green }} />
          <TextWidget text="  ·  " style={{ fontSize: 11, color: colors.muted }} />
          <TextWidget text={`${over} over`} style={{ fontSize: 11, fontWeight: '700', color: colors.negative }} />
          <TextWidget text={`  ·  ${formatRupees(perDay)}/day`} style={{ fontSize: 11, color: colors.muted }} />
        </FlexWidget>
      </FlexWidget>
      )}

      {rows.map((row, i) => (
        <FlexWidget key={i} style={{ flexDirection: 'row', width: 'match_parent', marginBottom: GAP }}>
          {row.map((d, j) => (
            <FlexWidget
              key={d.dayOfCycle}
              style={{
                width: cell,
                height: cell,
                marginRight: j === row.length - 1 ? 0 : GAP,
                borderRadius: 9,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: d.isFuture ? '#0A0A0A' : d.savedPaise > 0 ? UNDER : d.savedPaise < 0 ? OVER : '#0A0A0A',
              }}
            >
              <TextWidget text={String(d.dayOfCycle)} style={{ fontSize: cell >= 26 ? 10 : 9, color: colors.muted }} />
              {showAmounts && !d.isFuture && d.spentPaise !== 0 && (
                <TextWidget
                  text={formatRupeesCompact(d.savedPaise)}
                  style={{ fontSize: 9, fontWeight: '700', color: d.savedPaise < 0 ? colors.negative : colors.green }}
                />
              )}
            </FlexWidget>
          ))}
        </FlexWidget>
      ))}
    </WidgetShell>
  );
}
