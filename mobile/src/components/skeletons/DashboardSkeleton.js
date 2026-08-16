import { StyleSheet, View } from 'react-native';
import SkeletonBlock from './SkeletonBlock';
import { radius, spacing } from '../../theme';

export default function DashboardSkeleton() {
  return (
    <View style={styles.wrap}>
      <SkeletonBlock width={160} height={26} />
      <SkeletonBlock width={110} height={14} style={{ marginTop: spacing.xs }} />

      <View style={styles.statsGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <SkeletonBlock width={36} height={36} radius={12} />
            <SkeletonBlock width={48} height={22} style={{ marginTop: spacing.sm }} />
            <SkeletonBlock width={64} height={12} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>

      {[0, 1].map((i) => (
        <View key={i} style={styles.roomCard}>
          <View style={styles.roomHeaderRow}>
            <SkeletonBlock width={130} height={18} />
            <SkeletonBlock width={40} height={18} radius={radius.full} />
          </View>
          <SkeletonBlock width={90} height={12} style={{ marginTop: 8 }} />
          <View style={styles.rowGap}>
            <SkeletonBlock width="100%" height={14} />
            <SkeletonBlock width="100%" height={14} style={{ marginTop: 8 }} />
            <SkeletonBlock width="100%" height={14} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  roomHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { marginTop: spacing.md },
});
