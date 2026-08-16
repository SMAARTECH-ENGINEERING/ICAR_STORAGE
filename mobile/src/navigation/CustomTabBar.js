import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import alertApi from '../api/alertApi';
import queryKeys from '../utils/queryKeys';
import { useSocketEvent } from '../hooks/useSocketEvents';
import { colors, radius, spacing, typography } from '../theme';

const ICONS = {
  Dashboard: 'grid',
  Rooms: 'business',
  Alerts: 'notifications',
  Profile: 'person',
};
const ICONS_OUTLINE = {
  Dashboard: 'grid-outline',
  Rooms: 'business-outline',
  Alerts: 'notifications-outline',
  Profile: 'person-outline',
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth / state.routes.length;

  const { data, refetch } = useQuery({
    queryKey: queryKeys.alerts({ status: 'active' }),
    queryFn: () => alertApi.list({ status: 'active' }),
    staleTime: 15000,
  });
  useSocketEvent('alert:created', () => refetch());
  useSocketEvent('alert:resolved', () => refetch());
  const activeAlertCount = data?.length || 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(tabWidth * state.index + tabWidth / 2 - 26, { damping: 18, stiffness: 200 }) }],
  }));

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]} pointerEvents="box-none">
      <View style={styles.bar} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
        {barWidth > 0 ? <Animated.View style={[styles.indicator, indicatorStyle]} /> : null}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.tabBarLabel ?? route.name;

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          }

          const showBadge = route.name === 'Alerts' && activeAlertCount > 0;

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name={isFocused ? ICONS[route.name] : ICONS_OUTLINE[route.name]}
                  size={22}
                  color={isFocused ? colors.primary : colors.secondary}
                />
                {showBadge ? <TabBadge count={activeAlertCount} /> : null}
              </View>
              <Text
                style={[typography.caption, { color: isFocused ? colors.primary : colors.secondary, marginTop: 3 }]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabBadge({ count }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '92%',
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    paddingVertical: 10,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    width: 52,
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },
});
