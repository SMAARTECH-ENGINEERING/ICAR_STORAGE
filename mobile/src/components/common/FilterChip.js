import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FilterChip({ label, active, onPress, count }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withTiming(0.94, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive, animatedStyle]}
    >
      <Text style={[typography.bodySm, active ? styles.labelActive : styles.labelInactive]}>
        {label}
        {typeof count === 'number' ? ` (${count})` : ''}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.full,
    marginRight: spacing.xs,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipInactive: { backgroundColor: colors.card, borderColor: colors.border },
  labelActive: { color: colors.white, fontWeight: '700' },
  labelInactive: { color: colors.secondary, fontWeight: '600' },
});
