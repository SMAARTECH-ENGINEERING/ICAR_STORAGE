import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import IconButton from './IconButton';
import { colors, radius, spacing, typography } from '../../theme';

export default function AppHeader({
  title,
  subtitle,
  onBack,
  right,
  statusDot,
  large = false,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ marginTop: -insets.top }}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.row}>
          <View style={styles.left}>
            {onBack ? (
              <IconButton icon="chevron-back" color={colors.white} onPress={onBack} style={styles.backBtn} />
            ) : null}
            <View style={styles.titleWrap}>
              <View style={styles.titleRow}>
                {statusDot ? <View style={[styles.dot, { backgroundColor: statusDot }]} /> : null}
                <Text style={[large ? typography.h1 : typography.h2, styles.title]} numberOfLines={1}>
                  {title}
                </Text>
              </View>
              {subtitle ? (
                <Text style={[typography.body, styles.subtitle]} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { marginRight: spacing.xs },
  titleWrap: { flexShrink: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.white },
  subtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
