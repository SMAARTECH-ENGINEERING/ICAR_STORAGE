import { StyleSheet, Text, View } from 'react-native';
import AnimatedCard from '../common/AnimatedCard';
import { fieldIcon, fieldLabel, fieldUnit, formatValue, isZoneField, toTitleCase } from '../../utils/sensorUtils';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

// Renders whatever measurement keys a zone actually contains — nothing here
// assumes a fixed zone name or fixed set of measurements, per the backend's
// dynamic sensor model (device-defined zone keys and fields).
export default function SensorZoneCard({ zoneName, zoneData = {}, hasAlert = false, style }) {
  const fields = Object.entries(zoneData).filter(([key]) => isZoneField(key));

  return (
    <AnimatedCard style={[styles.card, hasAlert && styles.cardAlert, style]}>
      <View style={styles.headerRow}>
        <Text style={[typography.overline, styles.zoneName]}>{toTitleCase(zoneName)}</Text>
        {zoneData.sensor_model ? (
          <Text style={[typography.caption, styles.model]}>{zoneData.sensor_model}</Text>
        ) : null}
      </View>

      {fields.length === 0 ? (
        <Text style={[typography.bodySm, styles.empty]}>No readings yet</Text>
      ) : (
        <View style={styles.fieldsGrid}>
          {fields.map(([key, value]) => (
            <View key={key} style={styles.field}>
              <Ionicons name={fieldIcon(key)} size={14} color={colors.primary} />
              <Text style={[typography.h3, styles.fieldValue]}>
                {formatValue(value, key)}
                <Text style={styles.fieldUnit}>{fieldUnit(key)}</Text>
              </Text>
              <Text style={[typography.caption, styles.fieldLabel]}>{fieldLabel(key)}</Text>
            </View>
          ))}
        </View>
      )}
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  cardAlert: { borderWidth: 1.5, borderColor: colors.danger },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zoneName: { color: colors.primaryDark },
  model: { color: colors.secondary },
  empty: { color: colors.secondary, marginTop: spacing.sm },
  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: spacing.md },
  field: { minWidth: 72 },
  fieldValue: { color: colors.text, marginTop: 4 },
  fieldUnit: { fontSize: 12, color: colors.secondary, fontWeight: '600' },
  fieldLabel: { color: colors.secondary, marginTop: 2 },
});
