import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient'; // Import the Supabase client

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    try {
      // Use Supabase client to sign up.
      // The database trigger you created will automatically handle
      // creating a profile in the public.users table.
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      Alert.alert(
        "Success",
        "Your account has been created! Please check your email for a confirmation link to complete registration.",
        [{ text: "OK", onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>
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
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>
          <View style={styles.buttonWrapper}>
            <Button title="Register" onPress={handleRegister} color="#28a745" />
          </View>
          <View style={styles.loginWrapper}>
            <Button
              title="Already have an account? Login"
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
  }
});
