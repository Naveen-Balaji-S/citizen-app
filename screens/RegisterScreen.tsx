import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Register'
>;

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email || !password) {
      Alert.alert(t('error'), t('register_validation_fields'));
      return;
    }

    setIsLoading(true);
    try {
      // Sign up and pass extra metadata (name & mobile number)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            mobile_number: mobileNumber.trim(),
          },
        },
      });
      if (error) throw error;

      const user = data.user;
      if (user) {
        // Keep DB in sync with current i18n language
        const { error: upsertError } = await supabase.from('users').upsert(
          {
            user_id: user.id,
            email,
            language_code: i18n.language,
          },
          { onConflict: 'user_id' }
        );
        if (upsertError) throw upsertError;
      }

      Alert.alert(
        t('success'),
        t('registration_success_message'),
        [{ text: t('ok'), onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      Alert.alert(t('registration_failed_title'), err.message);
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
        placeholder={t('full_name_placeholder')}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        editable={!isLoading}
      />
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
        placeholder={t('mobile_placeholder')}
        value={mobileNumber}
        onChangeText={setMobileNumber}
        keyboardType="phone-pad"
        editable={!isLoading}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder={t('password_placeholder')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
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

      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>
          <View style={styles.buttonWrapper}>
            <Button
              title={t('register_button')}
              onPress={handleRegister}
              color="#28a745"
            />
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
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8f9fa' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#343a40' },
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
  passwordInput: { flex: 1, height: 50, paddingHorizontal: 15, fontSize: 16 },
  eyeIcon: { padding: 10 },
  buttonWrapper: { marginVertical: 6 },
  loginWrapper: { marginTop: 20 },
  languageContainer: { position: 'absolute', top: 50, right: 20 },
});
