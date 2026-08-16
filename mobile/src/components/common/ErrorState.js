import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { colors, radius, spacing, typography } from '../../theme';

export default function ErrorState({
  isNetworkError = false,
  title,
  description,
  onRetry,
  style,
}) {
  const resolvedTitle = title || (isNetworkError ? 'No Internet Connection' : 'Something went wrong');
  const resolvedDescription =
    description ||
    (isNetworkError ? 'Check your connection and try again.' : "We couldn't load this. Please try again.");

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={isNetworkError ? 'cloud-offline-outline' : 'alert-circle-outline'} size={32} color={colors.danger} />
      </View>
      <Text style={[typography.h2, styles.title]}>{resolvedTitle}</Text>
      <Text style={[typography.body, styles.description]}>{resolvedDescription}</Text>
      {onRetry ? (
        <PrimaryButton title="Try Again" onPress={onRetry} icon="refresh" fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { color: colors.text, textAlign: 'center' },
  description: {
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  action: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
});
