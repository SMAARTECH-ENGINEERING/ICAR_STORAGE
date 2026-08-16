import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function IconButton({
  icon,
  onPress,
  size = 22,
  color = colors.text,
  backgroundColor = 'transparent',
  style,
  disabled = false,
  badge = false,
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => (scale.value = withTiming(0.88, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      hitSlop={8}
      style={[
        styles.base,
        { backgroundColor, width: size + 20, height: size + 20, opacity: disabled ? 0.4 : 1 },
        animatedStyle,
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
      {badge ? <Animated.View style={styles.badge} /> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
});
