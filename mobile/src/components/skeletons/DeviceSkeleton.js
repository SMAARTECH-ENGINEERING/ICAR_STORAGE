import { StyleSheet, View } from 'react-native';
import SkeletonBlock from './SkeletonBlock';
import { radius, spacing } from '../../theme';

export default function DeviceSkeleton({ count = 3 }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <SkeletonBlock width={36} height={36} radius={radius.md} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <SkeletonBlock width="60%" height={16} />
              <SkeletonBlock width="40%" height={12} style={{ marginTop: 6 }} />
            </View>
            <SkeletonBlock width={50} height={18} radius={radius.full} />
          </View>
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
