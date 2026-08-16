import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import IconButton from './IconButton';
import { colors, radius, spacing, typography } from '../../theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Search…', style }) {
  return (
    <View style={[styles.wrap, style]}>
      <Ionicons name="search" size={18} color={colors.secondary} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        style={[typography.body, styles.input]}
        returnKeyType="search"
      />
      {value ? <IconButton icon="close-circle" size={16} color={colors.secondary} onPress={() => onChangeText('')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  icon: { marginRight: spacing.xs },
  input: { flex: 1, color: colors.text, height: '100%' },
});
