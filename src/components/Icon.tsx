import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { OTHERS_CATEGORY_NAME } from '../models/types';

export type IconName =
  | 'briefcase'
  | 'plus'
  | 'dots'
  | 'arrow-up'
  | 'arrow-down'
  | 'equal'
  | 'piggy-bank'
  | 'wallet'
  | 'calculator'
  | 'pie-chart'
  | 'tag'
  | 'calendar'
  | 'lightbulb'
  | 'inbox'
  | 'info'
  | 'sparkle'
  | 'shield'
  | 'fuel'
  | 'utensils'
  | 'bag'
  | 'bus'
  | 'file-text'
  | 'heart'
  | 'gamepad'
  | 'bar-chart'
  | 'chevron-right'
  | 'chevron-down'
  | 'clock'
  | 'settings'
  | 'refresh';

/** Minimal line-icon set (Lucide-style paths) rendered via react-native-svg — no icon font needed. */
export function Icon({ name, size = 20, color = '#FFFFFF', strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };

  switch (name) {
    case 'briefcase':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={2} y={7} width={20} height={14} rx={2} {...common} />
          <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" {...common} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 12h14" {...common} />
          <Path d="M12 5v14" {...common} />
        </Svg>
      );
    case 'dots':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={5} cy={12} r={1.4} fill={color} />
          <Circle cx={12} cy={12} r={1.4} fill={color} />
          <Circle cx={19} cy={12} r={1.4} fill={color} />
        </Svg>
      );
    case 'arrow-up':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 19V5" {...common} />
          <Path d="m5 12 7-7 7 7" {...common} />
        </Svg>
      );
    case 'arrow-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 5v14" {...common} />
          <Path d="m19 12-7 7-7-7" {...common} />
        </Svg>
      );
    case 'equal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1={5} x2={19} y1={9} y2={9} {...common} />
          <Line x1={5} x2={19} y1={15} y2={15} {...common} />
        </Svg>
      );
    case 'piggy-bank':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M11 5c-3.9 0-7 2.7-7 6 0 1.7.8 3.2 2 4.2V19a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.3c.6.2 1.3.3 2 .3s1.4-.1 2-.3v.3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2.2c.6-.6 1.1-1.3 1.4-2.1" {...common} />
          <Path d="M18 10.5c1 0 2-.5 2-1.8S19 7 18 7" {...common} />
          <Path d="M4 11h1.5" {...common} />
          <Circle cx={9} cy={10} r={0.6} fill={color} stroke="none" />
        </Svg>
      );
    case 'wallet':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" {...common} />
          <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" {...common} />
          <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" {...common} />
        </Svg>
      );
    case 'calculator':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={4} y={2} width={16} height={20} rx={2} {...common} />
          <Line x1={8} x2={16} y1={6} y2={6} {...common} />
          <Line x1={16} x2={16} y1={14} y2={18} {...common} />
          <Circle cx={16} cy={10} r={0.6} fill={color} stroke="none" />
          <Circle cx={12} cy={10} r={0.6} fill={color} stroke="none" />
          <Circle cx={8} cy={10} r={0.6} fill={color} stroke="none" />
          <Circle cx={12} cy={14} r={0.6} fill={color} stroke="none" />
          <Circle cx={8} cy={14} r={0.6} fill={color} stroke="none" />
          <Circle cx={12} cy={18} r={0.6} fill={color} stroke="none" />
          <Circle cx={8} cy={18} r={0.6} fill={color} stroke="none" />
        </Svg>
      );
    case 'pie-chart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" {...common} />
          <Path d="M22 12A10 10 0 0 0 12 2v10z" {...common} />
        </Svg>
      );
    case 'refresh':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path {...common} d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <Path {...common} d="M21 3v5h-5" />
          <Path {...common} d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          <Path {...common} d="M3 21v-5h5" />
        </Svg>
      );

    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            {...common}
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
          />
          <Circle {...common} cx="12" cy="12" r="3" />
        </Svg>
      );

    case 'tag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" {...common} />
          <Circle cx={7.5} cy={7.5} r={1.2} fill={color} stroke="none" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={3} y={4} width={18} height={18} rx={2} {...common} />
          <Line x1={16} x2={16} y1={2} y2={6} {...common} />
          <Line x1={8} x2={8} y1={2} y2={6} {...common} />
          <Line x1={3} x2={21} y1={10} y2={10} {...common} />
        </Svg>
      );
    case 'lightbulb':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" {...common} />
          <Path d="M9 18h6" {...common} />
          <Path d="M10 22h4" {...common} />
        </Svg>
      );
    case 'inbox':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polyline points="22 12 16 12 14 15 10 15 8 12 2 12" {...common} />
          <Path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" {...common} />
        </Svg>
      );
    case 'info':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={10} {...common} />
          <Path d="M12 16v-4" {...common} />
          <Circle cx={12} cy={8} r={0.6} fill={color} stroke="none" />
        </Svg>
      );
    case 'sparkle':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" {...common} fill={color} />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M20 13c0 5-3.5 7.5-7.35 8.8a1 1 0 0 1-.7-.01C8.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
            {...common}
          />
        </Svg>
      );
    case 'fuel':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1={3} x2={15} y1={22} y2={22} {...common} />
          <Line x1={4} x2={14} y1={9} y2={9} {...common} />
          <Path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" {...common} />
          <Path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" {...common} />
        </Svg>
      );
    case 'utensils':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" {...common} />
          <Path d="M7 2v20" {...common} />
          <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" {...common} />
        </Svg>
      );
    case 'bag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" {...common} />
          <Path d="M3 6h18" {...common} />
          <Path d="M16 10a4 4 0 0 1-8 0" {...common} />
        </Svg>
      );
    case 'bus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M8 6v6" {...common} />
          <Path d="M15 6v6" {...common} />
          <Path d="M2 12h19.6" {...common} />
          <Path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" {...common} />
          <Circle cx={7} cy={18} r={2} {...common} />
          <Path d="M9 18h5" {...common} />
          <Circle cx={16} cy={18} r={2} {...common} />
        </Svg>
      );
    case 'file-text':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z" {...common} />
          <Path d="M14 2v6h6" {...common} />
          <Line x1={8} x2={16} y1={13} y2={13} {...common} />
          <Line x1={8} x2={16} y1={17} y2={17} {...common} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M19 14c1.5-1.5 3-3.4 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.7 0-3.2.8-4.5 2.1C10.7 3.8 9.2 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.1 1.5 4 3 5.5l7 7Z"
            {...common}
          />
        </Svg>
      );
    case 'gamepad':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1={6} x2={10} y1={12} y2={12} {...common} />
          <Line x1={8} x2={8} y1={10} y2={14} {...common} />
          <Circle cx={15} cy={13} r={0.6} fill={color} stroke="none" />
          <Circle cx={18} cy={11} r={0.6} fill={color} stroke="none" />
          <Path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5Z" {...common} />
        </Svg>
      );
    case 'bar-chart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1={12} x2={12} y1={20} y2={10} {...common} />
          <Line x1={18} x2={18} y1={20} y2={4} {...common} />
          <Line x1={6} x2={6} y1={20} y2={16} {...common} />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="m9 18 6-6-6-6" {...common} />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="m6 9 6 6 6-6" {...common} />
        </Svg>
      );
    case 'clock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={10} {...common} />
          <Path d="M12 6v6l4 2" {...common} />
        </Svg>
      );
    default:
      return null;
  }
}

const CATEGORY_ICON_ORDER: Array<{ match: (n: string) => boolean; icon: IconName }> = [
  { match: (n) => n.includes('fuel') || n.includes('petrol') || n.includes('gas'), icon: 'fuel' },
  { match: (n) => n.includes('food') || n.includes('restaurant') || n.includes('dining') || n.includes('eat'), icon: 'utensils' },
  { match: (n) => n.includes('shop') || n.includes('grocer'), icon: 'bag' },
  { match: (n) => n.includes('transport') || n.includes('travel') || n.includes('commute') || n.includes('bus') || n.includes('cab'), icon: 'bus' },
  { match: (n) => n.includes('bill') || n.includes('utilit') || n.includes('rent') || n.includes('emi'), icon: 'file-text' },
  { match: (n) => n.includes('health') || n.includes('medic') || n.includes('doctor') || n.includes('pharma'), icon: 'heart' },
  { match: (n) => n.includes('entertain') || n.includes('movie') || n.includes('game') || n.includes('subscription'), icon: 'gamepad' },
];

/**
 * Best-guess icon for a free-form category or merchant name. The dots glyph is
 * reserved for the Others catch-all, so an unrecognised category gets the
 * generic tag instead — otherwise the two are indistinguishable.
 */
export function categoryIconFor(name: string): IconName {
  if (name === OTHERS_CATEGORY_NAME) return 'dots';
  const n = name.toLowerCase();
  return CATEGORY_ICON_ORDER.find((c) => c.match(n))?.icon ?? 'tag';
}
