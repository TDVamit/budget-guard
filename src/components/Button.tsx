import React from 'react';
import { ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../app/theme/ThemeProvider';
import { spacing, typography } from '../app/theme/theme';
import { PressableSurface } from './Surface';

type Variant = 'primary' | 'secondary' | 'destructive';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  // Primary is the one filled control; the rest are the panel itself, raised.
  const textColor =
    variant === 'primary' ? colors.onAccent : variant === 'destructive' ? colors.negative : colors.text;

  return (
    <PressableSurface
      onPress={onPress}
      disabled={isDisabled}
      size="control"
      accessibilityLabel={title}
      style={[styles.base, variant === 'primary' && { backgroundColor: colors.accent }, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[typography.body, styles.label, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
      )}
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
