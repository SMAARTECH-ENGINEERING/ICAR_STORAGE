import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppHeader from '../../components/common/AppHeader';
import AnimatedCard from '../../components/common/AnimatedCard';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { roleLabel } from '../../utils/permissions';
import { colors, radius, spacing, typography } from '../../theme';

const ROLE_TONE = { SUPER_ADMIN: 'danger', ADMIN: 'info', VIEWER: 'neutral' };

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    setConfirmLogout(false);
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader title="Profile" large />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[typography.h2, styles.name]}>{user?.name}</Text>
          <Text style={[typography.body, styles.email]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleBg(user?.role) }]}>
            <Ionicons name="shield-checkmark" size={13} color={roleFg(user?.role)} />
            <Text style={[typography.caption, { color: roleFg(user?.role), marginLeft: 4 }]}>{roleLabel(user?.role)}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <SettingRow
            icon="person-outline"
            label="Account"
            hint="Manage your account details"
            onPress={() => Alert.alert('Account', 'Account changes are managed by your administrator.')}
          />
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            hint="Alerts and system notifications"
            onPress={() => Alert.alert('Notifications', 'Notification preferences are coming soon.')}
          />
          <SettingRow
            icon="color-palette-outline"
            label="Theme"
            hint="Light"
            onPress={() => Alert.alert('Theme', 'Dark mode is coming soon.')}
          />
          <SettingRow
            icon="information-circle-outline"
            label="About"
            hint="Smaatech Agri v1.0.0"
            onPress={() => Alert.alert('About', 'Smaatech Agri — Smart Environmental Monitoring\nVersion 1.0.0')}
          />
          <SettingRow
            icon="log-out-outline"
            label="Logout"
            tone="danger"
            onPress={() => setConfirmLogout(true)}
            hideChevron
          />
        </Animated.View>
      </ScrollView>

      <ConfirmModal
        visible={confirmLogout}
        title="Log Out?"
        message="You'll need to sign in again to access your dashboard."
        confirmLabel="Log Out"
        tone="danger"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </ScreenContainer>
  );
}

function roleBg(role) {
  if (role === 'SUPER_ADMIN') return colors.dangerLight;
  if (role === 'ADMIN') return colors.infoLight;
  return colors.secondaryLight;
}
function roleFg(role) {
  if (role === 'SUPER_ADMIN') return colors.danger;
  if (role === 'ADMIN') return colors.info;
  return colors.secondary;
}

function SettingRow({ icon, label, hint, onPress, tone = 'default', hideChevron = false }) {
  const tint = tone === 'danger' ? colors.danger : colors.text;
  return (
    <AnimatedCard onPress={onPress} style={styles.settingRow}>
      <View style={styles.settingRowInner}>
        <View style={[styles.settingIcon, tone === 'danger' && { backgroundColor: colors.dangerLight }]}>
          <Ionicons name={icon} size={18} color={tone === 'danger' ? colors.danger : colors.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h3, { color: tint }]}>{label}</Text>
          {hint ? <Text style={[typography.bodySm, styles.settingHint]}>{hint}</Text> : null}
        </View>
        {!hideChevron ? <Ionicons name="chevron-forward" size={18} color={colors.secondary} /> : null}
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: colors.white, fontSize: 26, fontWeight: '800' },
  name: { color: colors.text },
  email: { color: colors.secondary, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  settingRow: { marginBottom: spacing.sm },
  settingRowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingHint: { color: colors.secondary, marginTop: 2 },
});
