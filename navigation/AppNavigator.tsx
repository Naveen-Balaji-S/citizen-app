import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import i18n from '../lib/i18n';

// Import all screens
import HomeScreen from '../screens/HomeScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import SuccessScreen from '../screens/SuccessScreen';
import ViewReportsScreen from '../screens/ViewReportsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import CommunityReportsScreen from '../screens/CommunityReportsScreen';

// Define the parameter lists for the separate stacks
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  ReportForm: undefined;
  Success: undefined;
  ViewReports: undefined;
  Notifications: undefined;
  Leaderboard: undefined;
  CommunityReports: undefined;
};

export type RootStackParamList = AuthStackParamList & MainStackParamList;

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

// Define the stack navigators for each flow
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: i18n.t('dashboard_title'),
        headerLeft: () => null,
      }}
    />
    <MainStack.Screen
      name="ReportForm"
      component={ReportIssueScreen}
      options={{ title: i18n.t('file_new_report') }}
    />
    <MainStack.Screen
      name="Success"
      component={SuccessScreen}
      options={{ title: i18n.t('success_title'), headerLeft: () => null }}
    />
    <MainStack.Screen
      name="ViewReports"
      component={ViewReportsScreen}
      options={{ title: i18n.t('view_reports_title') }}
    />
    <MainStack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: i18n.t('notifications_screen_title') }}
    />
    <MainStack.Screen
      name="Leaderboard"
      component={LeaderboardScreen}
      options={{ title: i18n.t('leaderboard_title') }}
    />
    <MainStack.Screen
      name="CommunityReports"
      component={CommunityReportsScreen}
      options={{ title: i18n.t('community_reports_title') }}
    />
  </MainStack.Navigator>
);

export default function AppNavigator() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener checks for a valid session and updates the state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        // Fetch user profile to get language setting
        const { data, error } = await supabase
          .from('users')
          .select('language_code')
          .eq('user_id', session.user.id)
          .single();
        if (data?.language_code) {
          i18n.locale = data.language_code;
        }
      }
      setLoading(false);
    });

    // Cleanup the subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </SafeAreaView>
    );
  }

  // The app's main router
  return session ? <MainNavigator /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
