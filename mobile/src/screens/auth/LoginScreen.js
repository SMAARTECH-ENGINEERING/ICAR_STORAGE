import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, spacing, typography } from '../../theme';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function validate() {
    if (!email.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address';
    if (!password) return 'Password is required';
    return '';
  }

  async function handleLogin() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.blobsWrap]} pointerEvents="none">
        <View style={styles.blobLarge} />
        <View style={styles.blobSmall} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xl }]}
      >
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.brandWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={30} color={colors.white} />
          </View>
          <Text style={styles.brandTitle}>Smaatech Agri</Text>
          <Text style={styles.brandSubtitle}>Smart Environmental Monitoring</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(150).springify()} style={styles.card}>
          <Text style={[typography.h2, styles.formTitle]}>Welcome back</Text>
          <Text style={[typography.body, styles.formSubtitle]}>Sign in to continue monitoring</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor={colors.secondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={[typography.body, styles.input]}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.secondary}
                secureTextEntry={!showPassword}
                style={[typography.body, styles.input]}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.secondary} />
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton title="Login" onPress={handleLogin} loading={loading} style={styles.loginBtn} />

          <Pressable
            style={styles.forgotWrap}
            onPress={() => Alert.alert('Forgot Password', 'Please contact your administrator to reset your password.')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <View style={styles.registerRow}>
            <Text style={styles.registerHint}>Don&apos;t have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Create one</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  blobsWrap: { overflow: 'hidden' },
  blobLarge: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -60,
  },
  blobSmall: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 60,
    left: -60,
  },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.xl },
  brandWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.xxl,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: { fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: -0.3 },
  brandSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  formTitle: { color: colors.text },
  formSubtitle: { color: colors.secondary, marginTop: 2, marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  label: { ...typography.bodySm, color: colors.text, marginBottom: 6, fontWeight: '700' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    height: 52,
  },
  inputIcon: { marginRight: spacing.xs },
  input: { flex: 1, color: colors.text, height: '100%' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: 6,
  },
  errorText: { color: colors.danger, flexShrink: 1, fontSize: 13, fontWeight: '600' },
  loginBtn: { marginTop: spacing.xs },
  forgotWrap: { alignItems: 'center', marginTop: spacing.lg },
  forgotText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  registerHint: { color: colors.secondary, fontSize: 13 },
  registerLink: { color: colors.primary, fontWeight: '800', fontSize: 13 },
});
