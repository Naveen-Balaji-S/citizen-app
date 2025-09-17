import React,{ useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient'; // Import the Supabase client

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handles traditional email and password sign-in
    const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
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
      Alert.alert('Authentication Error', error.message);
      setIsLoading(false);
    }
  }

  // Handles the password reset flow
  async function handlePasswordReset() {
    if (!email) {
        Alert.alert("Error", "Please enter your email address in the email field to reset your password.");
        return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'yourapp://login' // Optional: A deep link to return the user to your app
    });

    if (error) {
        Alert.alert("Error", error.message);
    } else {
        Alert.alert("Success", "A password reset link has been sent to your email address.");
    }
    setIsLoading(false);
  }


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />

      <TouchableOpacity onPress={handlePasswordReset} disabled={isLoading}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator style={{marginTop: 20}} size="large" color="#007bff" />
      ) : (
        <>
          <View style={styles.buttonWrapper}>
            <Button title="Login" onPress={handleLogin} color="#007bff" />
          </View>
          
          <Text style={styles.orText}>or</Text>

          <View style={styles.buttonWrapper}>
            <Button 
              title="Sign in with Google" 
              onPress={signInWithGoogle} 
              color="#4285F4" 
            />
          </View>
          
          <View style={styles.signUpWrapper}>
            <Button
              title="Don't have an account? Sign Up"
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

