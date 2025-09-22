import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import i18n, { setLanguage } from '../lib/i18n.ts';

type LanguageSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LanguageSelection'>;

export default function LanguageSelectionScreen() {
  const navigation = useNavigation<LanguageSelectionScreenNavigationProp>();

  const handleLanguageSelect = async (locale: 'en' | 'hi') => {
    await setLanguage(locale);
    // After selection, navigate to the Login screen.
    // The Login screen will now be in the selected language.
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('select_language_title')}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleLanguageSelect('en')}
      >
        <Text style={styles.buttonText}>{i18n.t('english')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleLanguageSelect('hi')}
      >
        <Text style={styles.buttonText}>{i18n.t('hindi')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});
