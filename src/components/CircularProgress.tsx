import React from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../app/theme/ThemeProvider';
import { useFillProgress } from '../app/motion/animations';
import { useDepth } from './Surface';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * A dial pressed into the panel: the track is a recessed groove, the arc is the
 * lit indicator. The arc sweeps from zero on arrival so the ratio is read as a
 * movement, not a static shape.
 */
export function CircularProgress({
  ratio,
  size = 44,
  strokeWidth = 4,
  color,
  trackColor,
  delay = 0,
  children,
}: {
  ratio: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  delay?: number;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const groove = useDepth('inset', 0.5);
  const clamped = Math.max(0, Math.min(1, ratio));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useFillProgress(700, delay);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference * (1 - clamped)],
  });

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
        groove,
      ]}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? colors.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}
