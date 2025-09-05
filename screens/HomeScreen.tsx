import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as SecureStore from 'expo-secure-store';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('user_token');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Logout Failed', 'Unable to log out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Welcome Header */}
        <Text style={styles.welcomeText}>Welcome to the Civic Crowd Reporting App</Text>
        <Text style={styles.subtitleText}>
          Report local issues like potholes, broken streetlights, or overflowing bins in real-time, 
          and track their resolution by municipal authorities.
        </Text>

        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <Text style={styles.mapText}>Map will be displayed here</Text>
        </View>

        {/* Action Buttons Side by Side */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, { marginRight: 10 }]}
            onPress={() => navigation.navigate('ReportForm')}
          >
            <Text style={styles.buttonText}>File New Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { marginLeft: 10, backgroundColor: '#6f42c1' }]}
            onPress={() => navigation.navigate('ViewReports')}
          >
            <Text style={styles.buttonText}>View Past Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
  },
  mapContainer: {
    height: 299, // Reduced height
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#dee2e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  mapText: {
    color: '#6c757d',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  welcomeText: {
  fontSize: 22,
  fontWeight: '700',
  textAlign: 'center',
  color: '#333',
  marginBottom: 15,
},
subtitleText: {
  fontSize: 16,
  textAlign: 'center',
  color: '#555',
  marginBottom: 15,
  paddingHorizontal: 10,
},
});
