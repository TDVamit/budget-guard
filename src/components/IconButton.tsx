import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';
import { useTheme } from '../app/theme/ThemeProvider';

/**
 * Small icon-only control (remove/delete "−" glyphs etc). Visually compact,
 * but the tappable area is padded out to the ~44dp minimum via hitSlop so
 * it's forgiving to tap, with a visible pressed state.
 */
export function IconButton({
  glyph,
  onPress,
  color,
  size = 28,
  accessibilityLabel,
  style,
}: {
  glyph: string;
  onPress: () => void;
  color?: string;
  size?: number;
  accessibilityLabel: string;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const hitSlop = Math.max(0, Math.ceil((44 - size) / 2));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: colors.border, radius: size }}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: color ?? colors.text, fontSize: size * 0.6, lineHeight: size * 0.7 }}>{glyph}</Text>
    </Pressable>
  );
}
