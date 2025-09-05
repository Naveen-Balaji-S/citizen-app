// navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
//import ReportFormScreen from '../screens/ReportFormScreen';
import HomeScreen from '../screens/HomeScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import SuccessScreen from '../screens/SuccessScreen';
import ViewReportsScreen from '../screens/ViewReportsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Define the type for the screen parameters, if any. For now, it's undefined.
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ReportForm: undefined;
  Success: undefined;
  ViewReports: undefined; 
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">

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
        options={{ title: 'Dashboard' }} 
      />
      <Stack.Screen
        name="ReportForm"
        component={ReportIssueScreen}
        options={{ title: 'File a New Report' }}
      />
      <Stack.Screen
        name="Success"
        component={SuccessScreen}
        options={{ title: 'Submission Successful', headerLeft: () => null }} // Hide back button
      />
      <Stack.Screen
        name="ViewReports"
        component={ViewReportsScreen}
        options={{ title: 'View Past Reports' }}
      />
    </Stack.Navigator>
  );
}