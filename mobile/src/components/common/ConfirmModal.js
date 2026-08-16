import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import { colors, radius, spacing, typography } from '../../theme';

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default', // 'default' | 'danger'
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {tone === 'danger' ? (
            <View style={styles.iconWrap}>
              <Ionicons name="warning-outline" size={26} color={colors.danger} />
            </View>
          ) : null}
          <Text style={[typography.h2, styles.title]}>{title}</Text>
          {message ? <Text style={[typography.body, styles.message]}>{message}</Text> : null}
          <View style={styles.actions}>
            <SecondaryButton title={cancelLabel} onPress={onCancel} style={styles.actionBtn} />
            <PrimaryButton
              title={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              style={[styles.actionBtn, tone === 'danger' && { backgroundColor: colors.danger, shadowColor: colors.danger }]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { color: colors.text },
  message: { color: colors.secondary, marginTop: spacing.xxs, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  actionBtn: { flex: 1 },
});
