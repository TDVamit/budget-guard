import { OTHERS_CATEGORY_NAME } from '../models/types';

/** Inline line-icon SVGs for the home screen widget (react-native-android-widget's SvgWidget
 * renders a static color baked into the markup — no runtime tinting), based on the Lucide icon set. */

const svg = (body: string, stroke = '#FFFFFF') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const SHIELD_LOGO_ICON = svg(
  '<path d="M20 13c0 5-3.5 7.5-7.35 8.8a1 1 0 0 1-.7-.01C8.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>' +
    '<line x1="9" y1="14" x2="9" y2="16"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="15" y1="12.5" x2="15" y2="16"/>',
);

export const FUEL_ICON = svg(
  '<line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/>' +
    '<path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/>' +
    '<path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>',
);

export const FOOD_ICON = svg(
  '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>' +
    '<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
);

export const CART_ICON = svg(
  '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>' +
    '<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
);

export const BUS_ICON = svg(
  '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>' +
    '<path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>' +
    '<circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
);

export const DOTS_ICON = (color = '#FFFFFF') =>
  svg('<circle cx="5" cy="12" r="1.4" fill="' + color + '"/><circle cx="12" cy="12" r="1.4" fill="' + color + '"/><circle cx="19" cy="12" r="1.4" fill="' + color + '"/>', color);

export const PLUS_ICON = (color = '#121212') => svg('<path d="M5 12h14"/><path d="M12 5v14"/>', color);

export const TREND_UP_ICON = (color = '#6EE7A8') =>
  svg('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>', color);

export const CALENDAR_ICON = (color = '#9A9CA5') =>
  svg('<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>', color);

export const CHEVRON_DOWN_ICON = svg('<path d="m6 9 6 6 6-6"/>');

export const CHEVRON_RIGHT_ICON = (color = '#FFFFFF') => svg('<path d="m9 18 6-6-6-6"/>', color);

export const REFRESH_ICON = (color = '#9A9CA5') =>
  svg('<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/>'
    + '<path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>', color);

export const TAG_ICON = svg(
  '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>'
    + '<circle cx="7.5" cy="7.5" r="1.2" fill="#FFFFFF"/>',
);

export const CATEGORY_PALETTE = ['#F16565', '#4C8DF6', '#F5B65C', '#34D399', '#9B7BF0'] as const;

export function categoryIconFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('fuel') || n.includes('petrol') || n.includes('gas')) return FUEL_ICON;
  if (n.includes('food') || n.includes('restaurant') || n.includes('dining') || n.includes('eat')) return FOOD_ICON;
  if (n.includes('grocer')) return CART_ICON;
  if (n.includes('transport') || n.includes('travel') || n.includes('commute') || n.includes('bus') || n.includes('cab'))
    return BUS_ICON;
  // Dots is reserved for the Others catch-all so users can tell them apart.
  return name === OTHERS_CATEGORY_NAME ? DOTS_ICON() : TAG_ICON;
}
