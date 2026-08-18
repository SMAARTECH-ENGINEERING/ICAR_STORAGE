import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import RoomDetailsScreen from '../screens/rooms/RoomDetailsScreen';
import CreateEditRoomScreen from '../screens/rooms/CreateEditRoomScreen';
import DeviceDetailsScreen from '../screens/devices/DeviceDetailsScreen';
import CreateEditDeviceScreen from '../screens/devices/CreateEditDeviceScreen';
import AutomationScreen from '../screens/devices/AutomationScreen';
import SensorHistoryScreen from '../screens/history/SensorHistoryScreen';
import ReportsScreen from '../screens/history/ReportsScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, animation: 'slide_from_right' }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} />
      <Stack.Screen name="CreateRoom" component={CreateEditRoomScreen} />
      <Stack.Screen name="EditRoom" component={CreateEditRoomScreen} />
      <Stack.Screen name="DeviceDetails" component={DeviceDetailsScreen} />
      <Stack.Screen name="CreateDevice" component={CreateEditDeviceScreen} />
      <Stack.Screen name="EditDevice" component={CreateEditDeviceScreen} />
      <Stack.Screen name="Automation" component={AutomationScreen} />
      <Stack.Screen name="SensorHistory" component={SensorHistoryScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}
