import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

function formatDate(date) {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DatePickerField({ label, value, onChange, maximumDate, minimumDate, style }) {
  const [iosPickerVisible, setIosPickerVisible] = useState(false);

  function handlePress() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        maximumDate,
        minimumDate,
        onValueChange: (event, selectedDate) => {
          if (selectedDate) onChange(selectedDate);
        },
      });
    } else {
      setIosPickerVisible(true);
    }
  }

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={handlePress}>
        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        <Text style={styles.value}>{formatDate(value)}</Text>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal transparent visible={iosPickerVisible} animationType="fade" onRequestClose={() => setIosPickerVisible(false)}>
          <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIosPickerVisible(false)} />
            <View style={styles.iosCard}>
              <DateTimePicker
                value={value}
                mode="date"
                display="inline"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onValueChange={(event, selectedDate) => {
                  if (selectedDate) onChange(selectedDate);
                }}
              />
              <Pressable style={styles.doneBtn} onPress={() => setIosPickerVisible(false)}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  label: { ...typography.bodySm, color: colors.text, marginBottom: 6, fontWeight: '700' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    height: 48,
    backgroundColor: colors.card,
  },
  value: { ...typography.body, color: colors.text },
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  iosCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    width: '88%',
  },
  doneBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  doneText: { color: colors.white, fontWeight: '700' },
});
