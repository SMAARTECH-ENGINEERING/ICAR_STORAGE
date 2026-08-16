import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import AnimatedCard from '../common/AnimatedCard';
import StatusBadge from '../common/StatusBadge';
import { colors, spacing, typography } from '../../theme';

export default function RelayCard({ relay, onPress, disabled = false }) {
  const isOn = relay.state === 'ON';
  const isAuto = relay.mode === 'auto';
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isOn) {
      pulse.value = withRepeat(withSequence(withTiming(0.35, { duration: 800 }), withTiming(1, { duration: 800 })), -1, true);
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isOn, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <AnimatedCard onPress={onPress} disabled={disabled} style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[typography.h3, styles.name]}>{relay.name || relay.relayId}</Text>
        <Animated.View style={[styles.dot, { backgroundColor: isOn ? colors.success : colors.border }, dotStyle]} />
      </View>

      <Text style={[typography.display, { color: isOn ? colors.primaryDark : colors.secondary }]}>
        {relay.state}
      </Text>

      <View style={styles.modeBlock}>
        <Text style={[typography.caption, styles.modeLabel]}>Mode</Text>
        <StatusBadge label={isAuto ? 'AUTO' : 'MANUAL'} tone={isAuto ? 'info' : 'neutral'} dot={false} />
      </View>

      {relay.controllingZone ? (
        <Text style={[typography.bodySm, styles.footer]} numberOfLines={1}>
          {relay.controllingZone} Control
        </Text>
      ) : null}
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: colors.text },
  dot: { width: 10, height: 10, borderRadius: 5 },
  modeBlock: { marginTop: spacing.md, gap: 6 },
  modeLabel: { color: colors.secondary },
  footer: { color: colors.secondary, marginTop: spacing.sm, textTransform: 'capitalize' },
});
