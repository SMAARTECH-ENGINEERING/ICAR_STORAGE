import { StyleSheet, View } from 'react-native';
import SkeletonBlock from './SkeletonBlock';
import { radius, spacing } from '../../theme';

export default function RelaySkeleton({ count = 2 }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <SkeletonBlock width={100} height={16} />
            <SkeletonBlock width={44} height={24} radius={radius.full} />
          </View>
          <SkeletonBlock width={60} height={22} style={{ marginTop: spacing.md }} />
          <SkeletonBlock width={80} height={12} style={{ marginTop: spacing.sm }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
