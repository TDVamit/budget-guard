import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from '../models/types';
import { formatRupees } from '../components/MoneyText';
import { LINKS, ProgressBar, WidgetHeader, WidgetShell, colors, statusColorFor } from './shared';

/** A small stat tile — the building block instead of a text row. */
/**
 * Label first: if the widget is shrunk and the row gets clipped, a visible
 * label with a cut number still means something — a bare number doesn't.
 */
function Chip({ label, paise, accent }: { label: string; paise: number; accent?: `#${string}` }) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: 'column',
        backgroundColor: colors.raised,
        borderRadius: 12,
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 4,
        paddingRight: 4,
        alignItems: 'center',
      }}
    >
      <TextWidget text={label} style={{ fontSize: 9, color: colors.muted }} />
      <TextWidget text={formatRupees(paise)} style={{ fontSize: 13, fontWeight: '700', color: accent ?? colors.text, marginTop: 1 }} />
    </FlexWidget>
  );
}

function Gap({ size = 8 }: { size?: number }) {
  return <FlexWidget style={{ width: size, height: size }} />;
}

/**
 * Projected savings leads, so it survives being resized down — the supporting
 * numbers are tiles that can be clipped without losing the headline.
 */
export function SavingsWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  const projected = snapshot.projectedSavingsPaise;
  const budget = snapshot.totalCategoryBudgetPaise;
  const spent = snapshot.totalVariableSpendPaise;
  const spentRatio = budget > 0 ? spent / budget : 0;

  return (
    <WidgetShell>
      <WidgetHeader title="THIS CYCLE" updatedAt={snapshot.updatedAt} />
      <Gap />

      <FlexWidget
        style={{
          flexDirection: 'column',
          width: 'match_parent',
          backgroundColor: colors.raised,
          borderRadius: 16,
          padding: 12,
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: LINKS.dashboard }}
      >
        <TextWidget text="PROJECTED SAVINGS" style={{ fontSize: 9, color: colors.muted }} />
        <TextWidget
          text={formatRupees(projected)}
          style={{ fontSize: 26, fontWeight: '700', color: projected < 0 ? colors.negative : colors.green, marginTop: 1 }}
        />
        <ProgressBar ratio={spentRatio} color={statusColorFor(spent, budget)} />
        <TextWidget
          text={`${formatRupees(spent)} spent of ${formatRupees(budget)}`}
          style={{ fontSize: 10, color: colors.muted, marginTop: 6 }}
        />
      </FlexWidget>

      <Gap />

      <FlexWidget style={{ flexDirection: 'row', width: 'match_parent' }}>
        <Chip label="SAVED SO FAR" paise={snapshot.monthlySavedFromDailyBudgetsPaise} accent={colors.green} />
        <Gap />
        <Chip label="SET ASIDE" paise={snapshot.savingsTargetPaise} />
        <Gap />
        <Chip label="EXTRA INCOME" paise={snapshot.adHocIncomePaise} />
      </FlexWidget>
    </WidgetShell>
  );
}
