import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppHeader from '../../components/common/AppHeader';
import PrimaryButton from '../../components/common/PrimaryButton';
import roomApi from '../../api/roomApi';
import queryKeys from '../../utils/queryKeys';
import { colors, radius, spacing, typography } from '../../theme';

export default function CreateEditRoomScreen({ route, navigation }) {
  const roomId = route.params?.roomId;
  const isEdit = !!roomId;
  const queryClient = useQueryClient();

  const roomQuery = useQuery({
    queryKey: queryKeys.room(roomId),
    queryFn: () => roomApi.get(roomId),
    enabled: isEdit,
  });

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (roomQuery.data) {
      setName(roomQuery.data.name || '');
      setCode(roomQuery.data.code || '');
      setLocation(roomQuery.data.location || '');
      setDescription(roomQuery.data.description || '');
    }
  }, [roomQuery.data]);

  async function handleSave() {
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }
    setError('');
    setSaving(true);
    const payload = { name: name.trim(), code: code.trim(), location: location.trim(), description: description.trim() };
    try {
      if (isEdit) {
        await roomApi.update(roomId, payload);
        queryClient.invalidateQueries({ queryKey: queryKeys.room(roomId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.roomCurrent(roomId) });
      } else {
        await roomApi.create(payload);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']} statusBarStyle="light">
      <AppHeader title={isEdit ? 'Edit Room' : 'Create Room'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <Field label="Room Name *" value={name} onChangeText={setName} placeholder="e.g. Greenhouse A" />
          <Field label="Code" value={code} onChangeText={setCode} placeholder="e.g. GH-A" autoCapitalize="characters" />
          <Field label="Location" value={location} onChangeText={setLocation} placeholder="e.g. North Wing" />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Optional notes about this room"
            multiline
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title={isEdit ? 'Save Changes' : 'Create Room'} onPress={handleSave} loading={saving} style={styles.saveBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({ label, multiline, style, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.secondary}
        multiline={multiline}
        style={[typography.body, styles.input, multiline && styles.multiline, style]}
        {...inputProps}
      />
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
  multiline: { height: 100, paddingTop: spacing.sm, textAlignVertical: 'top' },
  error: { color: colors.danger, fontWeight: '600', marginBottom: spacing.sm },
  saveBtn: { marginTop: spacing.md },
});
