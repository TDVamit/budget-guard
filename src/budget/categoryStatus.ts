/**
 * Category colour is a status, not decoration: how much of what has accrued so
 * far has been spent. Shared by the app and the widgets so they can't drift.
 */
export type SpendStatus = 'unused' | 'healthy' | 'warning' | 'over';

/**
 * The one place hue is mandatory. Untouched stays neutral so an unused category
 * does not shout; from there green → amber → red tracks how much of what has
 * accrued is already gone. Always paired with the amount and a word, so the
 * meaning survives without colour.
 */
export const STATUS_COLORS: Record<SpendStatus, `#${string}`> = {
  unused: '#4A4A4A',
  healthy: '#3DDC84',
  warning: '#F5C24C',
  over: '#FF6B63',
};

/** Light theme: same ramp, darkened to clear contrast on white. */
export const STATUS_COLORS_LIGHT: Record<SpendStatus, `#${string}`> = {
  unused: '#C8C8C8',
  healthy: '#0A7D45',
  warning: '#8A6100',
  over: '#C2321F',
};

export function spendStatus(spentPaise: number, accruedPaise: number): SpendStatus {
  if (spentPaise <= 0) return 'unused';
  const ratio = accruedPaise > 0 ? spentPaise / accruedPaise : Infinity;
  if (ratio > 1) return 'over';
  if (ratio >= 0.8) return 'warning';
  return 'healthy';
}

export function statusColor(spentPaise: number, accruedPaise: number, dark = true): `#${string}` {
  const status = spendStatus(spentPaise, accruedPaise);
  return dark ? STATUS_COLORS[status] : STATUS_COLORS_LIGHT[status];
}

/** The word that travels with the colour, so status never depends on hue. */
export const STATUS_LABEL: Record<SpendStatus, string> = {
  unused: 'untouched',
  healthy: 'on track',
  warning: 'nearly used',
  over: 'over',
};
