// navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ReportFormScreen from '../screens/ReportFormScreen';
import SuccessScreen from '../screens/SuccessScreen';

// Define the type for the screen parameters, if any. For now, it's undefined.
export type RootStackParamList = {
  ReportForm: undefined;
  Success: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="ReportForm">
      <Stack.Screen
        name="ReportForm"
        component={ReportFormScreen}
        options={{ title: 'File a New Report' }}
      />
      <Stack.Screen
        name="Success"
        component={SuccessScreen}
        options={{ title: 'Submission Successful', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}