import 'react-native-gesture-handler'; // This must be the first import
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n'; // Your i18n configuration
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </I18nextProvider>
  );
}
