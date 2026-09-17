import { requestWidgetUpdate as requestWidgetUpdateNative, type WidgetInfo } from 'react-native-android-widget';
import type { BudgetCategory, BudgetCycle, Transaction } from '../models/types';
import { calculateWidgetSnapshot } from '../budget/calculateWidgetSnapshot';
import { BudgetWidget } from './BudgetWidget';
import { CategoriesWidget } from './CategoriesWidget';
import { TransactionsWidget } from './TransactionsWidget';
import { SavingsWidget } from './SavingsWidget';
import { CalendarWidget } from './CalendarWidget';

/** Call after any transaction/budget/category/cycle mutation from the foreground app (spec §18). */
export async function requestWidgetUpdate({
  cycle,
  categories,
  transactions,
}: {
  cycle: BudgetCycle;
  categories: BudgetCategory[];
  transactions: Transaction[];
}) {
  const snapshot = calculateWidgetSnapshot(cycle, categories, transactions);
  // renderWidget hands back the live WidgetInfo, so the list length matches the
  // size the user actually resized the widget to.
  const renderers = {
    BudgetWidget: (info: WidgetInfo) => <BudgetWidget snapshot={snapshot} heightDp={info.height} />,
    CategoriesWidget: (info: WidgetInfo) => <CategoriesWidget snapshot={snapshot} heightDp={info.height} />,
    TransactionsWidget: (info: WidgetInfo) => <TransactionsWidget snapshot={snapshot} heightDp={info.height} />,
    SavingsWidget: () => <SavingsWidget snapshot={snapshot} />,
    CalendarWidget: (info: WidgetInfo) => <CalendarWidget snapshot={snapshot} widthDp={info.width} heightDp={info.height} />,
  } as const;
  // A widget the user hasn't placed is a no-op, so just refresh them all.
  await Promise.all(
    Object.entries(renderers).map(([widgetName, renderWidget]) =>
      requestWidgetUpdateNative({ widgetName, renderWidget }),
    ),
  );
}
