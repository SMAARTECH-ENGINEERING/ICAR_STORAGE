import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 700,
  suffix = '',
  prefix = '',
  style,
}) {
  const numericTarget = Number(value);
  const [display, setDisplay] = useState(Number.isFinite(numericTarget) ? numericTarget : 0);
  const fromRef = useRef(display);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!Number.isFinite(numericTarget)) return undefined;
    const from = fromRef.current;
    const to = numericTarget;
    if (from === to) return undefined;

    const start = Date.now();
    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericTarget, duration]);

  if (!Number.isFinite(numericTarget)) {
    return <Text style={style}>{'--'}</Text>;
  }

  return (
    <Text style={style}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </Text>
  );
}
