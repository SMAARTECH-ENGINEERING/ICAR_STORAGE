import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius, shadows, spacing, typography } from '../../theme';

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
      <Text style={[typography.bodySm, active ? styles.labelActive : styles.labelInactive]} numberOfLines={1}>
        {label}
        {typeof count === 'number' ? ` (${count})` : ''}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.full,
    marginRight: spacing.xs,
    borderWidth: 1.5,
  },
  // Inactive fill is intentionally darker than the plain white card color —
  // on the screen's near-white background (#F8FAFC) a white chip with a
  // 1px hairline border was essentially invisible.
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadows.sm },
  chipInactive: { backgroundColor: colors.secondaryLight, borderColor: colors.border },
  labelActive: { color: colors.white, fontWeight: '700' },
  labelInactive: { color: colors.text, fontWeight: '600' },
});
