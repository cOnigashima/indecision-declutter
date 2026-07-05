import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BottomNav } from '../components/BottomNav';
import { CaptureScreen } from '../screens/CaptureScreen';
import { CandidateListScreen } from '../screens/CandidateListScreen';
import { DiscardedDetailScreen } from '../screens/DiscardedDetailScreen';
import { DiscardedListScreen } from '../screens/DiscardedListScreen';
import { EvacuationCompleteScreen } from '../screens/EvacuationCompleteScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { ItemEditScreen } from '../screens/ItemEditScreen';
import { PhotoViewerScreen } from '../screens/PhotoViewerScreen';
import { ReleaseCompleteScreen } from '../screens/ReleaseCompleteScreen';
import { ReleaseConfirmScreen } from '../screens/ReleaseConfirmScreen';
import { colors } from '../theme/tokens';
import type { RootStackParamList, TabParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.washi,
    card: colors.card,
    primary: colors.kachi,
    text: colors.sumi,
  },
};

function TabNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="CandidateList" component={CandidateListScreen} />
      <Tabs.Screen name="DiscardedList" component={DiscardedListScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator
        initialRouteName="Tabs"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.washi },
        }}
      >
        <RootStack.Screen name="Tabs" component={TabNavigator} />
        <RootStack.Screen name="Capture" component={CaptureScreen} />
        <RootStack.Screen name="EvacuationComplete" component={EvacuationCompleteScreen} />
        <RootStack.Screen name="ItemDetail" component={ItemDetailScreen} />
        <RootStack.Screen name="ItemEdit" component={ItemEditScreen} />
        <RootStack.Screen name="DiscardedDetail" component={DiscardedDetailScreen} />
        <RootStack.Group screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}>
          <RootStack.Screen name="PhotoViewer" component={PhotoViewerScreen} />
          <RootStack.Screen name="ReleaseConfirm" component={ReleaseConfirmScreen} />
        </RootStack.Group>
        <RootStack.Screen name="ReleaseComplete" component={ReleaseCompleteScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
