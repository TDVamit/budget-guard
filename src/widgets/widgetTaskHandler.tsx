import type { WidgetTaskHandler } from 'react-native-android-widget';
import { BudgetWidget } from './BudgetWidget';
import { CategoriesWidget } from './CategoriesWidget';
import { TransactionsWidget } from './TransactionsWidget';
import { SavingsWidget } from './SavingsWidget';
import { CalendarWidget } from './CalendarWidget';
import { runMigrations } from '../database/migrations/migrate';
import * as cycleRepo from '../database/repositories/cycleRepository';
import * as categoryRepo from '../database/repositories/categoryRepository';
import * as txRepo from '../database/repositories/transactionRepository';
import * as incomeRepo from '../database/repositories/incomeRepository';
import * as fixedRepo from '../database/repositories/fixedExpenseRepository';
import * as plannedRepo from '../database/repositories/plannedExpenseRepository';
import { calculateWidgetSnapshot } from '../budget/calculateWidgetSnapshot';
import { applyOthersRemainder } from '../budget/calculateCategoryAllowance';
import { discretionaryBudgetPaise } from '../budget/calculateSavings';
import type { WidgetSnapshot } from '../models/types';

/** Keys must match the Kotlin provider class names (RNWidgetProvider uses getSimpleName). */
const WIDGETS: Record<string, (snapshot: WidgetSnapshot, heightDp?: number, widthDp?: number) => React.ReactElement> = {
  BudgetWidget: (snapshot, h) => <BudgetWidget snapshot={snapshot} heightDp={h} />,
  CategoriesWidget: (snapshot, h) => <CategoriesWidget snapshot={snapshot} heightDp={h} />,
  TransactionsWidget: (snapshot, h) => <TransactionsWidget snapshot={snapshot} heightDp={h} />,
  SavingsWidget: (snapshot) => <SavingsWidget snapshot={snapshot} />,
  CalendarWidget: (snapshot, h, w) => <CalendarWidget snapshot={snapshot} widthDp={w} heightDp={h} />,
};

async function buildSnapshot(): Promise<WidgetSnapshot | null> {
  await runMigrations();
  const cycle = await cycleRepo.getActiveCycle();
  if (!cycle) return null;
  const [rawCategories, transactions, incomeSources, fixedExpenses, plannedExpenses] = await Promise.all([
    categoryRepo.listCategories(cycle.id),
    txRepo.listTransactions(cycle.id),
    incomeRepo.listIncomeSources(cycle.id),
    fixedRepo.listFixedExpenses(cycle.id),
    plannedRepo.listPlannedExpenses(cycle.id),
  ]);
  // Same derivation the app store does, so the widget can't drift from the app.
  const categories = applyOthersRemainder(
    rawCategories,
    discretionaryBudgetPaise({ incomeSources, fixedExpenses, plannedExpenses, savingsTargetPaise: cycle.savingsTargetPaise }),
  );
  return calculateWidgetSnapshot(cycle, categories, transactions);
}

/**
 * Runs in a headless JS context spun up by Android — the app UI may be
 * closed or the React runtime destroyed (spec §48/§51). Always recomputes
 * from SQLite rather than trusting any cached in-memory state.
 */
export const widgetTaskHandler: WidgetTaskHandler = async (props) => {
  const render = WIDGETS[props.widgetInfo.widgetName];
  if (!render) return;

  const snapshot = await buildSnapshot();
  if (!snapshot) return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
    case 'WIDGET_CLICK':
      props.renderWidget(render(snapshot, props.widgetInfo.height, props.widgetInfo.width));
      break;
    default:
      break;
  }
};
