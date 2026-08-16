import { StyleSheet, View } from 'react-native';
import SkeletonBlock from './SkeletonBlock';
import { radius, spacing } from '../../theme';

export default function SensorSkeleton({ count = 3 }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <SkeletonBlock width={70} height={12} />
          <SkeletonBlock width={90} height={26} style={{ marginTop: spacing.sm }} />
          <SkeletonBlock width={60} height={18} radius={radius.full} style={{ marginTop: spacing.sm }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg },
  card: { width: '47%', backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md },
});
