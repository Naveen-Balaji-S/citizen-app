import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import { showError } from '../lib/notification';
import usePushTokens from '../hooks/usePushToken';
import Ionicons from '@expo/vector-icons/Ionicons';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const expoPushToken = usePushTokens();
  useEffect(() => {
    if (expoPushToken) {
      console.log('Expo Push Token:', expoPushToken);
    }
  }, [expoPushToken]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUser(session.user);

        // Listen for this user's report updates
        const channel = supabase
          .channel('public:reports')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'reports', filter: `user_id=eq.${session.user.id}` },
            async (payload) => {
              const report = payload.new as { description?: string; status?: string };
              if (report?.description && report?.status) {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: 'Report Status Updated',
                    body: `Your report "${report.description}" is now ${report.status}`,
                  },
                  trigger: null,
                });
              }
            }
          )
          .subscribe();

        return () => supabase.removeChannel(channel);
      } catch (err) {
        showError(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigation.navigate('Login');
    } catch (err) {
      showError(err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeTitle}>Dashboard</Text>
            <Text style={styles.welcomeSubtitle}>Welcome back!</Text>
          </View>

          <View style={styles.iconRow}>
            {/* Bell icon to Notifications screen */}
            <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('Notifications', 'Coming soon!')}>
              <Ionicons name="notifications-outline" size={26} color="#1c1c1e" />
            </TouchableOpacity>

            {/* Profile icon to show email */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => user && Alert.alert('Logged in as', user.email!)}
            >
              <Ionicons name="person-circle-outline" size={30} color="#1c1c1e" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <Text style={styles.mapText}>Map will be displayed here</Text>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ReportForm')}>
            <Text style={styles.cardIcon}>📝</Text>
            <Text style={styles.cardTitle}>File a New Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ViewReports')}>
            <Text style={styles.cardIcon}>📂</Text>
            <Text style={styles.cardTitle}>View Past Reports</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: { fontSize: 28, fontWeight: 'bold', color: '#1c1c1e' },
  welcomeSubtitle: { fontSize: 16, color: '#6c757d' },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 16 },
  mapContainer: {
    flex: 0.7,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  mapText: { color: '#6c757d', fontSize: 16 },
  cardContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardIcon: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#343a40' },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
