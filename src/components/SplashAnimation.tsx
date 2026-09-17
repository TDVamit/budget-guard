import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../app/theme/ThemeProvider';
import { typography } from '../app/theme/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Length of the shield outline, used to draw it on with a dash offset. */
const SHIELD_PATH_LENGTH = 60;

/**
 * Splash animation: the shield draws itself, the budget bars grow inside it,
 * then the wordmark fades up. Runs on the native driver where it can, and
 * calls onFinish so the app can wait for it rather than flashing past.
 */
export function SplashAnimation({ onFinish }: { onFinish?: () => void }) {
  const { colors } = useTheme();
  const draw = useRef(new Animated.Value(0)).current;
  const bars = useRef(new Animated.Value(0)).current;
  const wordmark = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(draw, { toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(bars, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(wordmark, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(lift, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onFinish?.();
    });
  }, [draw, bars, wordmark, lift, onFinish]);

  const dashOffset = draw.interpolate({ inputRange: [0, 1], outputRange: [SHIELD_PATH_LENGTH, 0] });
  const barStyle = (delay: number) => ({
    transform: [
      {
        scaleY: bars.interpolate({ inputRange: [0, delay, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' as const }),
      },
    ],
    opacity: bars,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logo}>
        <Svg width={96} height={96} viewBox="0 0 24 24">
          <AnimatedPath
            d="M20 13c0 5-3.5 7.5-7.35 8.8a1 1 0 0 1-.7-.01C8.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
            stroke={colors.text}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={SHIELD_PATH_LENGTH}
            strokeDashoffset={dashOffset}
          />
        </Svg>

        {/* The three budget bars, growing from the baseline inside the shield. */}
        <View style={styles.bars} pointerEvents="none">
          <Animated.View style={[styles.bar, { height: 14, backgroundColor: colors.text }, barStyle(0)]} />
          <Animated.View style={[styles.bar, { height: 26, backgroundColor: colors.text }, barStyle(0.25)]} />
          <Animated.View style={[styles.bar, { height: 20, backgroundColor: colors.positive }, barStyle(0.5)]} />
        </View>
      </View>

      <Animated.View
        style={{
          opacity: wordmark,
          transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        <Text style={[typography.display, { fontSize: 26, color: colors.text, letterSpacing: 0.5 }]}>BudgetGuard</Text>
        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 4, letterSpacing: 1.2 }]}>
          PRIVATE · OFFLINE
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logo: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 28,
    marginTop: 8,
  },
  bar: {
    width: 5,
    borderRadius: 3,
  },
});
