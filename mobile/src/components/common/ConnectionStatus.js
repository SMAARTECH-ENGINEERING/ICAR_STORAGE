import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSocketStatus } from '../../context/SocketContext';
import { colors, radius, spacing, typography } from '../../theme';

const CONFIG = {
  connected: { label: 'Live', color: colors.success },
  connecting: { label: 'Connecting…', color: colors.warning },
  reconnecting: { label: 'Reconnecting…', color: colors.warning },
  disconnected: { label: 'Offline', color: colors.secondary },
};

export default function ConnectionStatus({ style }) {
  const status = useSocketStatus();
  const config = CONFIG[status] || CONFIG.disconnected;
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (status === 'connected') {
      pulse.value = withRepeat(withSequence(withTiming(0.4, { duration: 700 }), withTiming(1, { duration: 700 })), -1, true);
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [status, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View style={[styles.dot, { backgroundColor: config.color }, dotStyle]} />
      <Text style={[typography.caption, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
});
