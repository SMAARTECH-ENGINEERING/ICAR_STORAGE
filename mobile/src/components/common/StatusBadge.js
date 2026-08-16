import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const TONES = {
  success: { bg: colors.successLight, fg: colors.primaryDark, dot: colors.success },
  warning: { bg: colors.warningLight, fg: '#92400E', dot: colors.warning },
  danger: { bg: colors.dangerLight, fg: '#991B1B', dot: colors.danger },
  info: { bg: colors.infoLight, fg: '#1E40AF', dot: colors.info },
  neutral: { bg: colors.secondaryLight, fg: colors.secondary, dot: colors.secondary },
};

export default function StatusBadge({ label, tone = 'neutral', dot = true, style }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.dot }]} /> : null}
      <Text style={[typography.caption, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
});
