import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { motion } from '../theme/theme';
import { useReduceMotion } from './useReduceMotion';

/** Confident arrival curve — the native equivalent of cubic-bezier(0.16,1,0.3,1). */
export const ARRIVE = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Money counts to its value. Re-runs whenever the amount changes, so a detected
 * transaction visibly moves the number rather than swapping it.
 */
export function useCountUp(value: number, duration = motion.focal): number {
  const reduceMotion = useReduceMotion();
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (reduceMotion || previous.current === value) {
      previous.current = value;
      setDisplay(value);
      anim.setValue(value);
      return;
    }
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, { toValue: value, duration, easing: ARRIVE, useNativeDriver: false }).start(() => {
      setDisplay(value);
    });
    previous.current = value;
    return () => anim.removeListener(id);
  }, [value, duration, anim, reduceMotion]);

  return display;
}

/**
 * One authored entrance: children rise into place in sequence. Capped so a long
 * list never turns the stagger into a wait.
 */
export function Entrance({
  index = 0,
  distance = 14,
  duration = motion.layout,
  style,
  children,
}: {
  index?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const delay = Math.min(index * motion.stagger, 320);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: ARRIVE,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [index, duration, progress, reduceMotion]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** A value that eases from 0 to 1 once, for bars and rings that fill on arrival. */
export function useFillProgress(duration = motion.focal, delay = 0): Animated.Value {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: ARRIVE,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [duration, delay, progress, reduceMotion]);

  return progress;
}

export type { StyleProp, TextStyle };
