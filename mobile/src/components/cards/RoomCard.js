import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedCard from '../common/AnimatedCard';
import StatusBadge from '../common/StatusBadge';
import { fieldLabel, fieldUnit, formatValue } from '../../utils/sensorUtils';
import { colors, radius, spacing, typography } from '../../theme';

export default function RoomCard({
  room,
  deviceCount = 0,
  onlineCount = 0,
  offlineCount = 0,
  activeAlertCount = 0,
  sensors,
  onPress,
}) {
  const isOnline = onlineCount > 0;
  const sensorRows = sensors
    ? Object.entries(sensors).filter(([, v]) => v !== null && v !== undefined)
    : [];

  return (
    <AnimatedCard onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[typography.h3, styles.name]} numberOfLines={1}>
          {room.name}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.success : colors.secondary }]} />
      </View>
      {room.location ? (
        <Text style={[typography.bodySm, styles.location]} numberOfLines={1}>
          {room.location}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Ionicons name="hardware-chip-outline" size={14} color={colors.secondary} />
        <Text style={[typography.bodySm, styles.metaText]}>
          {deviceCount} Device{deviceCount === 1 ? '' : 's'}
        </Text>
        <Text style={[typography.bodySm, styles.metaDivider]}>•</Text>
        <Text style={[typography.bodySm, { color: colors.success }]}>{onlineCount} online</Text>
        {offlineCount > 0 ? (
          <Text style={[typography.bodySm, styles.metaText, { color: colors.secondary }]}> · {offlineCount} offline</Text>
        ) : null}
      </View>

      {sensorRows.length > 0 ? (
        <View style={styles.sensorBlock}>
          {sensorRows.map(([key, value]) => (
            <View key={key} style={styles.sensorRow}>
              <Text style={[typography.bodySm, styles.sensorLabel]}>{fieldLabel(key)}</Text>
              <Text style={[typography.body, styles.sensorValue]}>
                {formatValue(value, key)}
                {fieldUnit(key)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {activeAlertCount > 0 ? (
        <StatusBadge
          label={`${activeAlertCount} Active Alert${activeAlertCount === 1 ? '' : 's'}`}
          tone="danger"
          style={styles.alertBadge}
        />
      ) : null}
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: colors.text, flexShrink: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  location: { color: colors.secondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  metaText: { color: colors.secondary, marginLeft: 6 },
  metaDivider: { color: colors.border, marginHorizontal: 6 },
  sensorBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sensorRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sensorLabel: { color: colors.secondary },
  sensorValue: { color: colors.text, fontWeight: '700' },
  alertBadge: { marginTop: spacing.sm, borderRadius: radius.md },
});
