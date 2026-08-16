import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppHeader from '../../components/common/AppHeader';
import PrimaryButton from '../../components/common/PrimaryButton';
import SearchBar from '../../components/common/SearchBar';
import deviceApi from '../../api/deviceApi';
import roomApi from '../../api/roomApi';
import queryKeys from '../../utils/queryKeys';
import { colors, radius, spacing, typography } from '../../theme';

export default function CreateEditDeviceScreen({ route, navigation }) {
  const deviceId = route.params?.deviceId;
  const presetRoomId = route.params?.roomId;
  const isEdit = !!deviceId;
  const queryClient = useQueryClient();

  const deviceQuery = useQuery({
    queryKey: queryKeys.device(deviceId),
    queryFn: () => deviceApi.get(deviceId),
    enabled: isEdit,
  });
  const roomsQuery = useQuery({ queryKey: queryKeys.rooms, queryFn: () => roomApi.list() });
  const rooms = roomsQuery.data || [];

  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(presetRoomId || '');
  const [deviceType, setDeviceType] = useState('');
  const [firmwareVersion, setFirmwareVersion] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [roomSearch, setRoomSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (deviceQuery.data) {
      setDeviceIdInput(deviceQuery.data.deviceId);
      setName(deviceQuery.data.name || '');
      setRoomId(deviceQuery.data.roomId || '');
      setDeviceType(deviceQuery.data.deviceType || '');
      setFirmwareVersion(deviceQuery.data.firmwareVersion || '');
    }
  }, [deviceQuery.data]);

  const selectedRoom = rooms.find((r) => r.roomId === roomId);
  const filteredRooms = rooms.filter((r) => r.name.toLowerCase().includes(roomSearch.trim().toLowerCase()));

  async function handleSave() {
    if (!isEdit && !deviceIdInput.trim()) return setError('Device ID is required');
    if (!name.trim()) return setError('Device name is required');
    if (!roomId) return setError('Please select a room');

    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await deviceApi.update(deviceId, {
          name: name.trim(),
          roomId,
          deviceType: deviceType.trim(),
          firmwareVersion: firmwareVersion.trim(),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.device(deviceId) });
      } else {
        await deviceApi.create({
          deviceId: deviceIdInput.trim(),
          roomId,
          name: name.trim(),
          deviceType: deviceType.trim(),
          firmwareVersion: firmwareVersion.trim(),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Failed to save device');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader title={isEdit ? 'Edit Device' : 'Create Device'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          {!isEdit ? (
            <Field
              label="Device ID *"
              value={deviceIdInput}
              onChangeText={setDeviceIdInput}
              placeholder="e.g. DEV-001"
              autoCapitalize="characters"
            />
          ) : (
            <View style={styles.field}>
              <Text style={styles.label}>Device ID</Text>
              <View style={[styles.input, styles.readonlyInput]}>
                <Text style={{ color: colors.secondary }}>{deviceIdInput}</Text>
              </View>
            </View>
          )}

          <Field label="Device Name *" value={name} onChangeText={setName} placeholder="e.g. Environment Controller 1" />

          <View style={styles.field}>
            <Text style={styles.label}>Room *</Text>
            <Pressable style={styles.roomSelect} onPress={() => setPickerVisible(true)}>
              <Text style={{ color: selectedRoom ? colors.text : colors.secondary, ...typography.body }}>
                {selectedRoom ? selectedRoom.name : 'Select a room'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.secondary} />
            </Pressable>
          </View>

          <Field label="Device Type" value={deviceType} onChangeText={setDeviceType} placeholder="e.g. environment-controller" />
          <Field label="Firmware Version" value={firmwareVersion} onChangeText={setFirmwareVersion} placeholder="e.g. 1.2.0" />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title={isEdit ? 'Save Changes' : 'Create Device'} onPress={handleSave} loading={saving} style={styles.saveBtn} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <ScreenContainer>
          <AppHeader title="Select Room" onBack={() => setPickerVisible(false)} />
          <View style={styles.pickerSearch}>
            <SearchBar value={roomSearch} onChangeText={setRoomSearch} placeholder="Search rooms..." />
          </View>
          <FlatList
            data={filteredRooms}
            keyExtractor={(item) => item.roomId}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
            renderItem={({ item }) => (
              <Pressable
                style={styles.roomOption}
                onPress={() => {
                  setRoomId(item.roomId);
                  setPickerVisible(false);
                }}
              >
                <View>
                  <Text style={[typography.h3, { color: colors.text }]}>{item.name}</Text>
                  {item.location ? <Text style={[typography.bodySm, { color: colors.secondary }]}>{item.location}</Text> : null}
                </View>
                {item.roomId === roomId ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
              </Pressable>
            )}
          />
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}

function Field({ label, style, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.secondary} style={[typography.body, styles.input, style]} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  field: { marginBottom: spacing.md },
  label: { ...typography.bodySm, color: colors.text, marginBottom: 6, fontWeight: '700' },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    height: 52,
    color: colors.text,
  },
  readonlyInput: { justifyContent: 'center', backgroundColor: colors.secondaryLight },
  roomSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    height: 52,
  },
  error: { color: colors.danger, fontWeight: '600', marginBottom: spacing.sm },
  saveBtn: { marginTop: spacing.md },
  pickerSearch: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  roomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
