import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import AuthNavigator from './AuthNavigator';
import RootNavigator from './RootNavigator';
import useGlobalRealtimeSync from '../hooks/useGlobalRealtimeSync';

function RealtimeSync() {
  useGlobalRealtimeSync();
  return null;
}

export default function AppNavigator() {
  const { isAuthenticated, initializing } = useAuth();

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync().catch(() => {});
  }, [initializing]);

  if (initializing) {
    return null;
  }

  return (
    <SocketProvider>
      <NavigationContainer>
        {isAuthenticated ? (
          <>
            <RealtimeSync />
            <RootNavigator />
          </>
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
    </SocketProvider>
  );
}
