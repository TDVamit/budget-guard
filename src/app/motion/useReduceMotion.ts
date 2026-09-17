import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Android's "Remove animations" accessibility setting. Honouring it is a
 * platform obligation, not a nicety: values snap to their end state while
 * opacity and colour feedback stay, so nothing loses meaning.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) setReduce(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
