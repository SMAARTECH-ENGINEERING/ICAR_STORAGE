import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedCard from '../common/AnimatedCard';
import AnimatedNumber from '../common/AnimatedNumber';
import { colors, radius, spacing, typography } from '../../theme';

const TONES = {
  primary: { bg: colors.primaryLight, fg: colors.primaryDark },
  success: { bg: colors.successLight, fg: colors.primaryDark },
  warning: { bg: colors.warningLight, fg: '#92400E' },
  danger: { bg: colors.dangerLight, fg: '#991B1B' },
  info: { bg: colors.infoLight, fg: '#1E40AF' },
};

export default function StatCard({ icon, value, label, tone = 'primary', style }) {
  const t = TONES[tone] || TONES.primary;
  return (
    <AnimatedCard style={[styles.card, style]}>
      <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={20} color={t.fg} />
      </View>
      <AnimatedNumber value={value} style={[typography.statValue, styles.value]} />
      <Text style={[typography.bodySm, styles.label]}>{label}</Text>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: { width: '47.5%' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { color: colors.text, marginTop: spacing.sm },
  label: { color: colors.secondary, marginTop: 2 },
});
