import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from '../models/types';
import { BASE_CHROME, EmptyLine, LINKS, Spacer, TX_ROW_FULL, TransactionRow, WidgetHeader, WidgetShell, colors, rowsThatFit } from './shared';

/** "See all" footer sits below the list. */
const CHROME = BASE_CHROME + 22;

/** Today's transactions only. */
export function TransactionsWidget({ snapshot, heightDp }: { snapshot: WidgetSnapshot; heightDp?: number }) {
  const shown = snapshot.todaysTransactions.slice(0, rowsThatFit(heightDp, TX_ROW_FULL, CHROME, 6));
  return (
    <WidgetShell>
      <WidgetHeader title="TODAY'S TRANSACTIONS" updatedAt={snapshot.updatedAt} />
      <FlexWidget style={{ height: 10 }} />
      {shown.length === 0 ? (
        <EmptyLine text="Nothing spent today" />
      ) : (
        shown.map((t) => (
          <TransactionRow key={t.id} title={t.title} categoryName={t.categoryName} amountPaise={t.amountPaise} timestamp={t.timestamp} />
        ))
      )}

      <Spacer />

      <TextWidget
        text="See all transactions ›"
        style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: LINKS.transactions }}
      />
    </WidgetShell>
  );
}
