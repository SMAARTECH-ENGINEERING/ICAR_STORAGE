import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedCard from '../common/AnimatedCard';
import StatusBadge from '../common/StatusBadge';
import AnimatedNumber from '../common/AnimatedNumber';
import { colors, spacing, typography } from '../../theme';

const STATUS_TONE = { normal: 'success', warning: 'warning', critical: 'danger', unknown: 'neutral' };
const STATUS_LABEL = { normal: 'Normal', warning: 'Warning', critical: 'Critical', unknown: 'No Data' };

export default function SensorCard({ label, value, unit = '', decimals = 1, icon, status = 'normal', style }) {
  return (
    <AnimatedCard style={[styles.card, style]}>
      <View style={styles.headerRow}>
        {icon ? <Ionicons name={icon} size={16} color={colors.secondary} /> : null}
        <Text style={[typography.bodySm, styles.label]}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <AnimatedNumber value={value} decimals={decimals} suffix={unit} style={[typography.display, styles.value]} />
      </View>
      <StatusBadge label={STATUS_LABEL[status] || 'Normal'} tone={STATUS_TONE[status] || 'success'} />
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { color: colors.secondary },
  valueRow: { marginTop: spacing.sm, marginBottom: spacing.sm },
  value: { color: colors.text },
});
