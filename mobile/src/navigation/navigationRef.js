import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigateToAlerts() {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('MainTabs', { screen: 'Alerts' });
}
