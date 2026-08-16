import { StyleSheet, View } from 'react-native';
import SkeletonBlock from './SkeletonBlock';
import { radius, spacing } from '../../theme';

export default function AlertSkeleton({ count = 4 }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <SkeletonBlock width={28} height={28} radius={radius.md} />
            <SkeletonBlock width="55%" height={16} style={{ marginLeft: spacing.sm }} />
          </View>
          <SkeletonBlock width="40%" height={12} style={{ marginTop: spacing.sm }} />
          <SkeletonBlock width="30%" height={12} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
});
