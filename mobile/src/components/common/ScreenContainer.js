import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

export default function ScreenContainer({
  children,
  edges = ['top', 'left', 'right'],
  style,
  statusBarStyle = 'dark',
  backgroundColor = colors.background,
}) {
  return (
    <View style={[styles.root, { backgroundColor }]}>
      <StatusBar
        barStyle={statusBarStyle === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={backgroundColor}
        translucent={false}
      />
      <SafeAreaView edges={edges} style={[styles.root, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
