import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const DEMO_MODE = true; 
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert(t('error'), t('login_validation_fields'));
    return;
  }
  setIsLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user;
    if (user) {
      // keep the DB in sync with the current i18n language
      await supabase.from('users').upsert(
        {
          user_id: user.id,
          email: user.email,
          language_code: i18n.language,
        },
        { onConflict: 'user_id' }
      );

      // Navigate to Home like in the original code
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  } catch (err: any) {
    Alert.alert(t('login_failed_title'), err.message);
  } finally {
    setIsLoading(false);
  }
};
  async function signInWithGoogle() {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      Alert.alert(t('auth_error_title'), error.message);
      setIsLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      Alert.alert(t('error'), t('password_reset_validation'));
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'yourapp://login'
    });

    if (error) {
      Alert.alert(t('error'), error.message);
    } else {
      Alert.alert(t('success'), t('password_reset_success'));
    }
    setIsLoading(false);
  }

  const handleLanguageChange = (lang: 'en' | 'hi') => {
    i18n.changeLanguage(lang);
    Alert.alert(t('language_selection_message'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.languageContainer}>
        <LanguageSelector onSelectLanguage={handleLanguageChange} />
      </View>
      <Text style={styles.title}>{t('login_title')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('email_placeholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder={t('password_placeholder')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!DEMO_MODE && !isPasswordVisible}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <Ionicons
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={24}
            color="#6c757d"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handlePasswordReset} disabled={isLoading}>
        <Text style={styles.forgotPasswordText}>{t('forgot_password')}</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator style={{marginTop: 20}} size="large" color="#007bff" />
      ) : (
        <>
          <View style={styles.buttonWrapper}>
            <Button title={t('login_button')} onPress={handleLogin} color="#007bff" />
          </View>

          <Text style={styles.orText}>{t('or')}</Text>

          <View style={styles.buttonWrapper}>
            <Button
              title={t('sign_in_google')}
              onPress={signInWithGoogle}
              color="#4285F4"
            />
          </View>

          <View style={styles.signUpWrapper}>
            <Button
              title={t('signup_prompt')}
              onPress={() => navigation.navigate('Register')}
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  buttonWrapper: {
    marginVertical: 6,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 12,
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600'
  },
  signUpWrapper: {
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#007bff',
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 15,
  },
  languageContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
  }
});