import React,{ useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient'; // Import the Supabase client
import i18n from '../lib/i18n'; // Import the internationalization utility

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handles traditional email and password sign-in
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(i18n.t('error'), i18n.t('login_validation_fields'));
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error: any) {
      Alert.alert(i18n.t('login_failed_title'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handles Google OAuth sign-in
  async function signInWithGoogle() {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      Alert.alert(i18n.t('auth_error_title'), error.message);
      setIsLoading(false);
    }
  }

  // Handles the password reset flow
  async function handlePasswordReset() {
    if (!email) {
      Alert.alert(i18n.t('error'), i18n.t('password_reset_validation'));
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'yourapp://login' // Optional: A deep link to return the user to your app
    });

    if (error) {
      Alert.alert(i18n.t('error'), error.message);
    } else {
      Alert.alert(i18n.t('success'), i18n.t('password_reset_success'));
    }
    setIsLoading(false);
  }


  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('login_title')}</Text>
      <TextInput
        style={styles.input}
        placeholder={i18n.t('email_placeholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder={i18n.t('password_placeholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />

      <TouchableOpacity onPress={handlePasswordReset} disabled={isLoading}>
        <Text style={styles.forgotPasswordText}>{i18n.t('forgot_password')}</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator style={{marginTop: 20}} size="large" color="#007bff" />
      ) : (
        <>
          <View style={styles.buttonWrapper}>
            <Button title={i18n.t('login_button')} onPress={handleLogin} color="#007bff" />
          </View>
          
          <Text style={styles.orText}>{i18n.t('or')}</Text>

          <View style={styles.buttonWrapper}>
            <Button 
              title={i18n.t('sign_in_google')} 
              onPress={signInWithGoogle} 
              color="#4285F4" 
            />
          </View>
          
          <View style={styles.signUpWrapper}>
            <Button
              title={i18n.t('signup_prompt')}
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
  }
});
