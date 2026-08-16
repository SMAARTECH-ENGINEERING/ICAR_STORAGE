import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppHeader from '../../components/common/AppHeader';
import PrimaryButton from '../../components/common/PrimaryButton';
import deviceApi from '../../api/deviceApi';
import relayApi from '../../api/relayApi';
import roomApi from '../../api/roomApi';
import queryKeys from '../../utils/queryKeys';
import { toTitleCase } from '../../utils/sensorUtils';
import { colors, radius, spacing, typography } from '../../theme';

export default function AutomationScreen({ route, navigation }) {
  const { deviceId, relayId } = route.params;
  const queryClient = useQueryClient();

  const deviceQuery = useQuery({ queryKey: queryKeys.device(deviceId), queryFn: () => deviceApi.get(deviceId) });
  const relaysQuery = useQuery({ queryKey: queryKeys.relays(deviceId), queryFn: () => relayApi.list(deviceId) });
  const ruleQuery = useQuery({
    queryKey: queryKeys.automationRule(deviceId, relayId),
    queryFn: () => relayApi.getAutomationRule(deviceId, relayId),
    retry: false,
  });
  const roomCurrentQuery = useQuery({
    queryKey: queryKeys.roomCurrent(deviceQuery.data?.roomId),
    queryFn: () => roomApi.current(deviceQuery.data.roomId),
    enabled: !!deviceQuery.data?.roomId,
  });

  const relay = (relaysQuery.data || []).find((r) => r.relayId === relayId);
  const availableZones = useMemo(() => {
    const state = roomCurrentQuery.data?.sensorData?.find((s) => s.deviceId === deviceId);
    return Object.keys(state?.sensors || {});
  }, [roomCurrentQuery.data, deviceId]);

  const [enabled, setEnabled] = useState(true);
  const [zones, setZones] = useState([]);
  const [thresholdOn, setThresholdOn] = useState(30);
  const [thresholdOff, setThresholdOff] = useState(28);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ruleQuery.data) {
      setEnabled(ruleQuery.data.enabled ?? true);
      setZones(ruleQuery.data.zones || []);
      setThresholdOn(ruleQuery.data.thresholdOn ?? 30);
      setThresholdOff(ruleQuery.data.thresholdOff ?? 28);
    }
  }, [ruleQuery.data]);

  function toggleZone(zone) {
    setZones((prev) => (prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]));
  }

  async function handleSave() {
    if (zones.length === 0) return setError('Select at least one zone to control this relay');
    if (thresholdOff >= thresholdOn) return setError('Turn-off threshold must be lower than turn-on threshold');

    setError('');
    setSaving(true);
    try {
      await relayApi.upsertAutomationRule(deviceId, relayId, {
        enabled,
        zones,
        thresholdOn,
        thresholdOff,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.automationRule(deviceId, relayId) });
      queryClient.invalidateQueries({ queryKey: ['automationRules', deviceId] });
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Failed to save automation rule');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader title="Automation" subtitle={relay?.name || relayId} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.row}>
            <View>
              <Text style={[typography.h3, styles.rowLabel]}>Automation Mode</Text>
              <Text style={[typography.bodySm, styles.rowHint]}>Let the system control this relay automatically</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={enabled ? colors.primary : '#fff'}
            />
          </View>

          <Text style={[typography.h2, styles.sectionTitle]}>Control Zones</Text>
          <Text style={[typography.bodySm, styles.sectionHint]}>
            The relay reacts to the highest reading among the selected zones.
          </Text>
          <View style={styles.zonesGrid}>
            {availableZones.length === 0 ? (
              <Text style={[typography.body, { color: colors.secondary }]}>No sensor zones detected yet for this device.</Text>
            ) : (
              availableZones.map((zone) => {
                const selected = zones.includes(zone);
                return (
                  <Pressable key={zone} onPress={() => toggleZone(zone)} style={[styles.zoneChip, selected && styles.zoneChipActive]}>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={selected ? colors.white : colors.secondary}
                    />
                    <Text style={[typography.bodySm, { color: selected ? colors.white : colors.text, marginLeft: 6, fontWeight: '700' }]}>
                      {toTitleCase(zone)}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>

          <Text style={[typography.h2, styles.sectionTitle]}>Turn ON at</Text>
          <Stepper value={thresholdOn} onChange={setThresholdOn} unit="°C" />

          <Text style={[typography.h2, styles.sectionTitle]}>Turn OFF at</Text>
          <Stepper value={thresholdOff} onChange={setThresholdOff} unit="°C" />

          <View style={styles.explainer}>
            <View style={styles.explainerRow}>
              <View style={[styles.explainerDot, { backgroundColor: colors.danger }]} />
              <Text style={[typography.body, styles.explainerText]}>{thresholdOn}°C — Relay turns ON</Text>
            </View>
            <View style={styles.explainerBar}>
              <View style={styles.explainerBarFill} />
            </View>
            <View style={styles.explainerRow}>
              <View style={[styles.explainerDot, { backgroundColor: colors.info }]} />
              <Text style={[typography.body, styles.explainerText]}>{thresholdOff}°C — Relay turns OFF</Text>
            </View>
            <Text style={[typography.bodySm, styles.explainerCaption]}>
              Between {thresholdOff}°C–{thresholdOn}°C the relay keeps its current state.
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Save Automation Rule" onPress={handleSave} loading={saving} style={styles.saveBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Stepper({ value, onChange, unit, step = 0.5 }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepperBtn} onPress={() => onChange(Math.round((value - step) * 10) / 10)}>
        <Ionicons name="remove" size={20} color={colors.primary} />
      </Pressable>
      <Text style={[typography.display, styles.stepperValue]}>
        {value}
        <Text style={styles.stepperUnit}>{unit}</Text>
      </Text>
      <Pressable style={styles.stepperBtn} onPress={() => onChange(Math.round((value + step) * 10) / 10)}>
        <Ionicons name="add" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  rowLabel: { color: colors.text },
  rowHint: { color: colors.secondary, marginTop: 2, maxWidth: 220 },
  sectionTitle: { color: colors.text, marginTop: spacing.lg, marginBottom: 4 },
  sectionHint: { color: colors.secondary, marginBottom: spacing.sm },
  zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryLight,
  },
  zoneChipActive: { backgroundColor: colors.primary },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { color: colors.text },
  stepperUnit: { fontSize: 16, color: colors.secondary, fontWeight: '600' },
  explainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  explainerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  explainerDot: { width: 10, height: 10, borderRadius: 5 },
  explainerText: { color: colors.text, fontWeight: '600' },
  explainerBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondaryLight,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  explainerBarFill: { height: '100%', width: '100%', backgroundColor: colors.primaryLight },
  explainerCaption: { color: colors.secondary, marginTop: spacing.xs },
  error: { color: colors.danger, fontWeight: '600', marginTop: spacing.md },
  saveBtn: { marginTop: spacing.lg },
});
