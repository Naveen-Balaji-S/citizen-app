import 'react-native-gesture-handler'; // This must be the first import
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n'; // Your i18n configuration
import AppNavigator from './navigation/AppNavigator';
import Toast from 'react-native-toast-message';

const toastConfig = {
  customSuccess: ({ text1, text2 }: { text1?: string, text2?: string }) => (
    <View style={styles.toastContainer}>
      <Ionicons name="checkmark-circle" size={24} color="#fff" />
      <View style={styles.toastTextContainer}>
        <Text style={styles.toastText1}>{text1}</Text>
        <Text style={styles.toastText2}>{text2}</Text>
      </View>
    </View>
  ),
};

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
          <Toast config={toastConfig} />
        </NavigationContainer>
      </PaperProvider>
    </I18nextProvider>
  );
}
