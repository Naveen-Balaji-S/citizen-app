// navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import the internationalization utility
import i18n from '../lib/i18n';

// Import all screens
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import HomeScreen from '../screens/HomeScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import SuccessScreen from '../screens/SuccessScreen';
import ViewReportsScreen from '../screens/ViewReportsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import CommunityReportsScreen from '../screens/CommunityReportsScreen';

// Define the type for the screen parameters
export type RootStackParamList = {
  LanguageSelection: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ReportForm: undefined;
  Success: undefined;
  ViewReports: undefined; 
  Notifications: undefined;
  Leaderboard: undefined;      
  CommunityReports: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="LanguageSelection">
      <Stack.Screen
        name="LanguageSelection"
        component={LanguageSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ 
          title: i18n.t('dashboard_title'),
          headerLeft: () => null // 👈 hides the back arrow
        }} 
      />
      <Stack.Screen
        name="ReportForm"
        component={ReportIssueScreen}
        options={{ title: i18n.t('file_new_report') }}
      />
      <Stack.Screen
        name="Success"
        component={SuccessScreen}
        options={{ title: i18n.t('success_title'), headerLeft: () => null }} // Hide back button
      />
      <Stack.Screen
        name="ViewReports"
        component={ViewReportsScreen}
        options={{ title: i18n.t('view_reports_title') }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: i18n.t('notifications_screen_title') }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: i18n.t('leaderboard_title') }}
      />
      <Stack.Screen
        name="CommunityReports"
        component={CommunityReportsScreen}
        options={{ title: i18n.t('community_reports_title') }}
      />
    </Stack.Navigator>
  );
}
