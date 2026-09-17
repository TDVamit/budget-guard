import React, { useMemo } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import { useTheme } from '../app/theme/ThemeProvider';
import { motion, radius as radii } from '../app/theme/theme';
import { useReduceMotion } from '../app/motion/useReduceMotion';

export type Depth = 'raised' | 'inset' | 'flat';
export type SurfaceSize = keyof typeof radii;

/**
 * The one primitive. Minimal and monochrome: a surface is defined by a hairline
 * and a near-black fill, not by shadow or translucency. On true black the card
 * barely lifts off the ground, which is the point — the data is the only thing
 * that is lit.
 *
 *   raised — a card: surface fill plus hairline
 *   flat   — the same card without the fill, for full-bleed lists
 *   inset  — a well cut into the surface: inputs, tracks, unselected controls
 */
export function useDepth(depth: Depth, intensity = 1): ViewStyle {
  const { colors, dark } = useTheme();
  return useMemo(() => {
    if (depth === 'inset') {
      return {
        backgroundColor: dark ? '#000000' : colors.surfaceAlt,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      } as ViewStyle;
    }
    if (depth === 'flat') {
      return {
        backgroundColor: 'transparent',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      } as ViewStyle;
    }
    return {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      opacity: intensity < 1 ? 0.85 : 1,
    } as ViewStyle;
  }, [colors, dark, depth, intensity]);
}

export function Surface({
  depth = 'raised',
  size = 'card',
  intensity,
  style,
  children,
}: {
  depth?: Depth;
  size?: SurfaceSize;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const shadow = useDepth(depth, intensity);
  return <View style={[{ borderRadius: radii[size] }, shadow, style]}>{children}</View>;
}

/**
 * Layout belongs to the touchable, painting belongs to the animated child.
 * Splitting them is what keeps the whole control tappable: put the caller's
 * flex/width on the inner view and the Pressable shrink-wraps to its text.
 */
const LAYOUT_KEYS = [
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'width', 'height',
  'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'margin', 'marginTop',
  'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal',
  'marginVertical', 'position', 'top', 'bottom', 'left', 'right', 'zIndex',
] as const;

export function splitStyle(style: StyleProp<ViewStyle>): { layout: ViewStyle; paint: ViewStyle } {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const layout: Record<string, unknown> = {};
  const paint: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    if ((LAYOUT_KEYS as readonly string[]).includes(key)) layout[key] = value;
    else paint[key] = value;
  }
  return { layout: layout as ViewStyle, paint: paint as ViewStyle };
}

/**
 * A control that presses into the surface. The Pressable carries the layout so
 * its hit area is the whole control; the child carries the paint and the spring.
 */
export function PressableSurface({
  onPress,
  depth = 'raised',
  size = 'card',
  intensity,
  disabled,
  style,
  children,
  accessibilityLabel,
}: {
  onPress?: () => void;
  depth?: Depth;
  size?: SurfaceSize;
  intensity?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const reduceMotion = useReduceMotion();
  const [pressed, setPressed] = React.useState(false);
  const scale = React.useRef(new Animated.Value(1)).current;
  const restingDepth = useDepth(depth, intensity);
  const pressedDepth = useDepth(depth === 'inset' ? 'inset' : 'raised', 0.5);
  const { layout, paint } = useMemo(() => splitStyle(style), [style]);

  function spring(toValue: number) {
    if (reduceMotion) {
      scale.setValue(toValue);
      return;
    }
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPressIn={() => {
        setPressed(true);
        spring(0.975);
      }}
      onPressOut={() => {
        setPressed(false);
        spring(1);
      }}
      style={[{ borderRadius: radii[size] }, layout]}
    >
      <Animated.View
        style={[
          // Fills the touchable so the painted area and the tappable area match.
          // alignSelf rather than width:100%, which collapses when the parent's
          // width is content-derived (the FAB).
          { flex: 1, alignSelf: 'stretch', borderRadius: radii[size], transform: [{ scale }] },
          pressed ? pressedDepth : restingDepth,
          disabled && { opacity: 0.5 },
          paint,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export { motion };
