import React from 'react';
import { FlexWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from '../models/types';
import { CATEGORY_PALETTE } from './icons';
import {
  AddTransactionButton,
  BASE_CHROME,
  CATEGORY_ROW,
  CategoryRow,
  EmptyLine,
  Spacer,
  WidgetHeader,
  WidgetShell,
  rowsThatFit,
} from './shared';

/** Add button (44) sits below the list. */
const CHROME = BASE_CHROME + 52;

/** Compact variant: categories, add button, refresh. Nothing else. */
export function CategoriesWidget({ snapshot, heightDp }: { snapshot: WidgetSnapshot; heightDp?: number }) {
  // Header plus the add button are the chrome; the rest is list.
  const shown = snapshot.categories.slice(0, rowsThatFit(heightDp, CATEGORY_ROW, CHROME, 4));
  return (
    <WidgetShell>
      <WidgetHeader title="CATEGORIES" updatedAt={snapshot.updatedAt} />
      <FlexWidget style={{ height: 10 }} />
      {shown.length === 0 ? (
        <EmptyLine text="No categories yet" />
      ) : (
        shown.map((c, i) => (
          <CategoryRow
            key={c.id}
            name={c.name}
            spentPaise={c.spentPaise}
            accruedPaise={c.accruedPaise}
            color={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]}
          />
        ))
      )}
      <Spacer />
      <AddTransactionButton compact />
    </WidgetShell>
  );
}
