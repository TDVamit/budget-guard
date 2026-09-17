import React from 'react';
import { format } from 'date-fns';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from '../models/types';
import { formatRupees } from '../components/MoneyText';
import { CALENDAR_ICON, CHEVRON_DOWN_ICON, CHEVRON_RIGHT_ICON, PLUS_ICON, TREND_UP_ICON } from './icons';
import {
  CategoryCard,
  CategoryRow,
  LINKS,
  ProgressBar,
  RefreshButton,
  TransactionRow,
  colors,
  statusColorFor,
} from './shared';

/** A grid row of two cards, plus the gap under it. */
const CARD_ROW_H = 73;
/** A single-line category row, used when a card row will not fit. */
const COMPACT_ROW_H = 38;
/** Shell padding, header, the available-today card, the label and the more-line. */
const LIST_CHROME = 172;
const PER_ROW = 2;

export function BudgetWidget({ snapshot, heightDp }: { snapshot: WidgetSnapshot; heightDp?: number }) {
  // At two launcher cells there is not enough height for the available-today
  // card *and* a row of grid cards, so the list degrades to single-line rows
  // rather than clipping the cards in half.
  const listHeight = (heightDp ?? 210) - LIST_CHROME;
  const cardRows = Math.min(3, Math.floor(listHeight / CARD_ROW_H));
  const useCards = cardRows >= 1;
  const capacity = useCards
    ? cardRows * PER_ROW
    : Math.max(1, Math.min(3, Math.floor(listHeight / COMPACT_ROW_H)));
  const shownCategories = snapshot.categories.slice(0, capacity);
  const moreCategories = snapshot.categories.length - shownCategories.length;
  const shownTransactions = snapshot.todaysTransactions.slice(0, 2);

  const savedPaise = snapshot.monthlySavedFromDailyBudgetsPaise;
  const savedColor = savedPaise < 0 ? colors.negative : colors.green;
  const totalAccrued = snapshot.categories.reduce((sum, c) => sum + c.accruedPaise, 0);
  const totalSpent = snapshot.categories.reduce((sum, c) => sum + c.spentPaise, 0);
  const availableToday = totalAccrued - totalSpent;

  const grid: (typeof shownCategories)[] = [];
  for (let i = 0; i < shownCategories.length; i += PER_ROW) grid.push(shownCategories.slice(i, i + PER_ROW));

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
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 'match_parent' }}>
        <FlexWidget
          style={{ flexDirection: 'row', alignItems: 'center' }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: LINKS.dashboard }}
        >
          <SvgWidget svg={CALENDAR_ICON(colors.muted)} style={{ width: 13, height: 13, marginRight: 6 }} />
          <TextWidget text="REMAINING THIS MONTH" style={{ fontSize: 10, color: colors.muted }} />
          <TextWidget text={formatRupees(savedPaise)} style={{ fontSize: 17, fontWeight: '700', color: savedColor, marginLeft: 7 }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text={format(snapshot.updatedAt, 'h:mm a')} style={{ fontSize: 11, color: colors.muted }} />
          <RefreshButton />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget style={{ height: 10 }} />

      <FlexWidget style={{ flexDirection: 'row', width: 'match_parent' }}>
        <FlexWidget style={{ flex: 3, flexDirection: 'column' }}>
          <FlexWidget
            style={{
              flexDirection: 'column',
              width: 'match_parent',
              backgroundColor: colors.raised,
              borderRadius: 16,
              padding: 10,
            }}
            clickAction="OPEN_URI"
            clickActionData={{ uri: LINKS.dashboard }}
          >
            <TextWidget text="Today's Remaining Budget" style={{ fontSize: 12, color: colors.muted }} />
            <TextWidget
              text={formatRupees(availableToday)}
              style={{ fontSize: 26, fontWeight: '700', color: availableToday < 0 ? colors.negative : colors.text, marginTop: 1 }}
            />
            <ProgressBar ratio={totalAccrued > 0 ? totalSpent / totalAccrued : 0} color={statusColorFor(totalSpent, totalAccrued)} />
          </FlexWidget>

          <FlexWidget
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 'match_parent', marginTop: 10, marginBottom: 6 }}
            clickAction="OPEN_URI"
            clickActionData={{ uri: LINKS.categories }}
          >
            <TextWidget text="Categories" style={{ fontSize: 12, color: colors.muted }} />
            <SvgWidget svg={CHEVRON_RIGHT_ICON(colors.muted)} style={{ width: 12, height: 12 }} />
          </FlexWidget>

          {useCards
            ? grid.map((row, i) => (
                <FlexWidget key={i} style={{ flexDirection: 'row', width: 'match_parent', marginBottom: 8 }}>
                  {row.map((c, j) => (
                    <CategoryCard
                      key={c.id}
                      name={c.name}
                      spentPaise={c.spentPaise}
                      accruedPaise={c.accruedPaise}
                      last={j === row.length - 1}
                    />
                  ))}
                </FlexWidget>
              ))
            : shownCategories.map((c) => (
                <CategoryRow key={c.id} name={c.name} spentPaise={c.spentPaise} accruedPaise={c.accruedPaise} />
              ))}

          {moreCategories > 0 && (
            <FlexWidget
              style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}
              clickAction="OPEN_URI"
              clickActionData={{ uri: LINKS.categories }}
            >
              <SvgWidget svg={CHEVRON_DOWN_ICON} style={{ width: 12, height: 12, marginRight: 6 }} />
              <TextWidget text={`${moreCategories} more — resize to see`} style={{ fontSize: 11, color: colors.muted }} />
            </FlexWidget>
          )}
        </FlexWidget>

        <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: colors.border, marginLeft: 12, marginRight: 12 }} />

        <FlexWidget style={{ flex: 2, flexDirection: 'column' }}>
          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.text,
              borderRadius: 26,
              padding: 8,
              width: 'match_parent',
            }}
            clickAction="OPEN_URI"
            clickActionData={{ uri: LINKS.addTransaction }}
            accessibilityLabel="Add transaction"
          >
            <FlexWidget
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
            >
              <SvgWidget svg={PLUS_ICON(colors.background)} style={{ width: 15, height: 15 }} />
            </FlexWidget>
            <TextWidget text="Add Transaction" style={{ fontSize: 13, fontWeight: '700', color: colors.background, marginLeft: 8 }} />
          </FlexWidget>

          <FlexWidget style={{ height: 1, backgroundColor: colors.border, width: 'match_parent', marginTop: 10, marginBottom: 8 }} />

          <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 'match_parent', marginBottom: 6 }}>
            <TextWidget text="Today" style={{ fontSize: 12, color: colors.muted }} />
            <FlexWidget
              style={{ flexDirection: 'row', alignItems: 'center' }}
              clickAction="OPEN_URI"
              clickActionData={{ uri: LINKS.transactions }}
            >
              <TextWidget text="See all" style={{ fontSize: 12, color: colors.text, fontWeight: '600' }} />
              <SvgWidget svg={CHEVRON_RIGHT_ICON(colors.text)} style={{ width: 11, height: 11, marginLeft: 3 }} />
            </FlexWidget>
          </FlexWidget>

          {shownTransactions.map((t, i) => (
            <FlexWidget key={t.id} style={{ flexDirection: 'column', width: 'match_parent' }}>
              {i > 0 && (
                <FlexWidget style={{ height: 1, backgroundColor: colors.border, width: 'match_parent', marginBottom: 8 }} />
              )}
              <TransactionRow
                title={t.title}
                categoryName={t.categoryName}
                amountPaise={t.amountPaise}
                timestamp={t.timestamp}
                compact
              />
            </FlexWidget>
          ))}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
