import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import BottomSheet from '../common/BottomSheet';
import PrimaryButton from '../common/PrimaryButton';
import relayApi from '../../api/relayApi';
import queryKeys from '../../utils/queryKeys';
import { useSocketEvent } from '../../hooks/useSocketEvents';
import { colors, radius, spacing, typography } from '../../theme';

const STEPS = {
  PENDING: 'Sending…',
  SENT: 'Sending…',
  ACKNOWLEDGED: 'Device Confirmed',
  CONFIRMED: 'Device Confirmed',
  FAILED: 'Command Failed',
  TIMEOUT: 'Command Timeout',
};

export default function RelayControlSheet({ visible, relay, deviceId, onClose }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(relay?.mode || 'manual');
  const [sending, setSending] = useState(false);
  const [command, setCommand] = useState(null); // { commandId, status }
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible && relay) {
      setMode(relay.mode || 'manual');
      setCommand(null);
      setErrorMsg('');
    }
  }, [visible, relay]);

  useSocketEvent('relay:command', (payload) => {
    if (!command || payload.commandId !== command.commandId) return;
    setCommand({ commandId: payload.commandId, status: payload.status });
    if (payload.status === 'FAILED' || payload.status === 'TIMEOUT') {
      setErrorMsg(payload.error || 'The device did not confirm this command.');
    }
  });

  useSocketEvent('relay:stateChanged', (payload) => {
    if (payload.deviceId !== deviceId || payload.relayId !== relay?.relayId) return;
    queryClient.setQueryData(queryKeys.relays(deviceId), (old) =>
      (old || []).map((r) => (r.relayId === relay.relayId ? { ...r, state: payload.state, mode: payload.mode || r.mode } : r))
    );
  });

  if (!relay) return null;

  const isOn = relay.state === 'ON';
  const nextState = isOn ? 'OFF' : 'ON';

  async function handleSend() {
    setSending(true);
    setErrorMsg('');
    try {
      const result = await relayApi.sendCommand(deviceId, relay.relayId, { mode, state: nextState });
      setCommand({ commandId: result.commandId, status: result.status || 'PENDING' });
      queryClient.invalidateQueries({ queryKey: queryKeys.relays(deviceId) });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send command');
    } finally {
      setSending(false);
    }
  }

  const commandDone = command && ['CONFIRMED', 'ACKNOWLEDGED', 'FAILED', 'TIMEOUT'].includes(command.status);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[typography.h1, styles.title]}>{relay.name || relay.relayId}</Text>

      <View style={styles.block}>
        <Text style={styles.blockLabel}>Current State</Text>
        <View style={styles.stateRow}>
          <View style={[styles.dot, { backgroundColor: isOn ? colors.success : colors.secondary }]} />
          <Text style={[typography.h2, { color: isOn ? colors.primaryDark : colors.secondary }]}>{relay.state}</Text>
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockLabel}>Control Mode</Text>
        <View style={styles.segmented}>
          {['manual', 'auto'].map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.segment, mode === m && styles.segmentActive]}
            >
              <Text style={[typography.h3, { color: mode === m ? colors.white : colors.text }]}>
                {m === 'manual' ? 'Manual' : 'Auto'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {command ? (
        <View style={styles.statusBlock}>
          {!commandDone ? <ActivityIndicator color={colors.primary} style={{ marginRight: spacing.xs }} /> : null}
          {commandDone ? (
            <Ionicons
              name={command.status === 'FAILED' || command.status === 'TIMEOUT' ? 'close-circle' : 'checkmark-circle'}
              size={18}
              color={command.status === 'FAILED' || command.status === 'TIMEOUT' ? colors.danger : colors.success}
              style={{ marginRight: spacing.xs }}
            />
          ) : null}
          <Text
            style={[
              typography.body,
              {
                color:
                  command.status === 'FAILED' || command.status === 'TIMEOUT'
                    ? colors.danger
                    : commandDone
                    ? colors.success
                    : colors.secondary,
              },
            ]}
          >
            {STEPS[command.status] || 'Sending…'}
          </Text>
        </View>
      ) : null}

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <PrimaryButton
        title={`Turn ${nextState}`}
        onPress={handleSend}
        loading={sending}
        disabled={sending || (command && !commandDone)}
        style={[styles.actionBtn, nextState === 'OFF' && styles.offBtn]}
      />
      <Pressable onPress={onClose} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>{commandDone || !command ? 'Close' : 'Cancel'}</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, marginBottom: spacing.md },
  block: { marginBottom: spacing.lg },
  blockLabel: { ...typography.caption, color: colors.secondary, marginBottom: spacing.sm },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.lg,
    padding: 4,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md },
  segmentActive: { backgroundColor: colors.primary },
  statusBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  errorText: { color: colors.danger, fontWeight: '600', marginBottom: spacing.md },
  actionBtn: {},
  offBtn: { backgroundColor: colors.text, shadowColor: colors.text },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { color: colors.secondary, fontWeight: '700' },
});
