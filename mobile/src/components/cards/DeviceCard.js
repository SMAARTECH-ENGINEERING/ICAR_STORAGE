import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedCard from '../common/AnimatedCard';
import StatusBadge from '../common/StatusBadge';
import { timeAgo } from '../../utils/timeUtils';
import { colors, radius, spacing, typography } from '../../theme';

const STATUS_TONE = { online: 'success', offline: 'neutral', unknown: 'warning' };

export default function DeviceCard({ device, onPress }) {
  const tone = STATUS_TONE[device.status] || 'neutral';
  return (
    <AnimatedCard onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="hardware-chip-outline" size={20} color={colors.primaryDark} />
        </View>
        <View style={styles.info}>
          <Text style={[typography.h3, styles.name]} numberOfLines={1}>
            {device.name}
          </Text>
          <Text style={[typography.bodySm, styles.meta]} numberOfLines={1}>
            {device.deviceType || device.deviceId}
            {device.lastSeen ? ` • ${timeAgo(device.lastSeen)}` : ''}
          </Text>
        </View>
        <StatusBadge label={device.status} tone={tone} />
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  info: { flex: 1 },
  name: { color: colors.text },
  meta: { color: colors.secondary, marginTop: 2, textTransform: 'capitalize' },
});
