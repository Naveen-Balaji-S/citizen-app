import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('login_validation_fields'));
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;
      if (user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ language_code: i18n.language })
          .eq('user_id', user.id);
        if (updateError) {
          throw updateError;
        }
      }

      Alert.alert(
        t('success'),
        t('registration_success_message'),
        [{ text: t('ok'), onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert(t('registration_failed_title'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.languageContainer}>
        <LanguageSelector onSelectLanguage={i18n.changeLanguage} />
      </View>
      <Text style={styles.title}>{t('register_title')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('email_placeholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder={t('password_placeholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>
          <View style={styles.buttonWrapper}>
            <Button title={t('register_button')} onPress={handleRegister} color="#28a745" />
          </View>
          <View style={styles.loginWrapper}>
            <Button
              title={t('login_prompt')}
              onPress={() => navigation.navigate('Login')}
              color="#6c757d"
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#343a40'
  },
  input: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonWrapper: {
    marginVertical: 6,
  },
  loginWrapper: {
    marginTop: 20,
  },
  languageContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
  }
});
