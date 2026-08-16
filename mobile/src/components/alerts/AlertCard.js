import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import AnimatedCard from '../common/AnimatedCard';
import StatusBadge from '../common/StatusBadge';
import { alertMeta, alertUnit, SEVERITY_TONE } from '../../utils/alertUtils';
import { formatValue } from '../../utils/sensorUtils';
import { timeAgo } from '../../utils/timeUtils';
import { colors, radius, spacing, typography } from '../../theme';

export default function AlertCard({ alert, roomName, deviceName, onPress }) {
  const meta = alertMeta(alert.type);
  const tone = alert.status === 'resolved' ? 'neutral' : SEVERITY_TONE[alert.severity] || 'warning';
  const isActive = alert.status === 'active';
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isActive && (alert.severity === 'high' || alert.severity === 'critical')) {
      pulse.value = withRepeat(withSequence(withTiming(0.5, { duration: 700 }), withTiming(1, { duration: 700 })), -1, true);
    }
  }, [isActive, alert.severity, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const iconBg = tone === 'danger' ? colors.dangerLight : tone === 'warning' ? colors.warningLight : colors.secondaryLight;
  const iconColor = tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : colors.secondary;

  return (
    <AnimatedCard onPress={onPress} style={[styles.card, !isActive && styles.cardResolved]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={meta.icon} size={18} color={iconColor} />
        </View>
        <Text style={[typography.h3, styles.title]} numberOfLines={1}>
          {meta.label}
        </Text>
        {isActive ? <Animated.View style={[styles.livedot, dotStyle]} /> : null}
      </View>

      {(roomName || deviceName) ? (
        <View style={styles.locationBlock}>
          {roomName ? <Text style={[typography.bodySm, styles.location]}>{roomName}</Text> : null}
          {(deviceName || alert.parameter) ? (
            <Text style={[typography.bodySm, styles.subLocation]} numberOfLines={1}>
              {deviceName ? deviceName : ''}
              {deviceName && alert.parameter ? ' • ' : ''}
              {alert.parameter ? `${alert.parameter} sensor` : ''}
            </Text>
          ) : null}
        </View>
      ) : null}

      {typeof alert.value === 'number' ? (
        <Text style={[typography.h1, styles.value]}>
          {formatValue(alert.value)}
          {alertUnit(alert.type)}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <StatusBadge label={isActive ? 'Active' : 'Resolved'} tone={isActive ? tone : 'success'} />
        <Text style={[typography.bodySm, styles.time]}>{timeAgo(alert.createdAt)}</Text>
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  cardResolved: { opacity: 0.7 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  title: { color: colors.text, flex: 1 },
  livedot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, marginLeft: spacing.xs },
  locationBlock: { marginTop: spacing.sm },
  location: { color: colors.text, fontWeight: '700' },
  subLocation: { color: colors.secondary, marginTop: 2, textTransform: 'capitalize' },
  value: { color: colors.text, marginTop: spacing.sm },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  time: { color: colors.secondary },
});
