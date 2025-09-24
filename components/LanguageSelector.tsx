import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import i18n from '../lib/i18n';

type LanguageSelectorProps = {
  onSelectLanguage: (lang: 'en' | 'hi') => void;
};

const LanguageSelector = ({ onSelectLanguage }: LanguageSelectorProps) => {
  return (
    <View style={styles.container}>
      <Button
        title="English"
        onPress={() => onSelectLanguage('en')}
      />
      <Button
        title="हिंदी"
        onPress={() => onSelectLanguage('hi')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
});

export default LanguageSelector;