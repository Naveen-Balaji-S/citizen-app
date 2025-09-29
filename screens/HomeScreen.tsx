// screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { showError } from '../lib/notification';
import usePushTokens from '../hooks/usePushToken';

type HomeScreenNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavProp>();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [civicPoints, setCivicPoints] = useState(0);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyReports, setNearbyReports] = useState<any[]>([]);
  const [draftCount, setDraftCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const isFocused = useIsFocused();
  const expoPushToken = usePushTokens();

  useEffect(() => {
    if (isFocused) fetchDraftCount();
  }, [isFocused, user]);

  useEffect(() => {
    const fetchDataOnFocus = async () => {
      if (!user) return;

      // Fetch unread notifications count
      const { count } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (count !== null) setUnreadCount(count);

      // Fetch civic points
      const { data: userData, error } = await supabase
        .from('users')
        .select('civic_points')
        .eq('user_id', user.id)
        .single();

      if (!error && userData) setCivicPoints(userData.civic_points);
    };

    if (isFocused) {
      fetchDataOnFocus();
      fetchDraftCount();
    }
  }, [isFocused, user]);

  useEffect(() => {
    const fetchLocationAndReports = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permission_required_title'), t('location_permission_message'));
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      const { data, error } = await supabase.functions.invoke('get-nearby-reports', {
        body: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });

      if (error) {
        console.error('Error fetching nearby reports:', error);
      } else {
        setNearbyReports(data.reports);
      }
    };

    if (isFocused) fetchLocationAndReports();
  }, [isFocused, t]);

  const fetchDraftCount = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const draftKeys = keys.filter(key => key.startsWith('@draft_report_'));
      setDraftCount(draftKeys.length);
    } catch (e) {
      console.error('Error fetching draft count:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }
        setUser(session.user);
      } catch (err) {
        showError(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
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

  const actionCards = [
    { title: t('file_new_report'), icon: 'document-text-outline', onPress: () => navigation.navigate('ReportForm', { draft: undefined }) },
    { title: t('my_reports_card'), icon: 'folder-outline', onPress: () => navigation.navigate('ViewReports') },
    { title: t('community_reports_card'), icon: 'people-outline', onPress: () => navigation.navigate('CommunityReports') },
    { title: t('leaderboard_card'), icon: 'trophy-outline', onPress: () => navigation.navigate('Leaderboard') },
    { title: t('drafts_card'), icon: 'clipboard-outline', onPress: () => navigation.navigate('Drafts'), badge: draftCount },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeTitle}>{t('dashboard_title')}</Text>
            <Text style={styles.pointsText}>
              🏆 {t('civic_points_label', { points: civicPoints })}
            </Text>
          </View>

          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={26} color="#1c1c1e" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => user && Alert.alert(t('logged_in_as'), user.email!)}
            >
              <Ionicons name="person-circle-outline" size={30} color="#1c1c1e" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Horizontal Action Cards */}
        <View style={{ marginBottom: 15 }}>
          <FlatList
            data={actionCards}
            horizontal
            keyExtractor={(item, index) => `${item.title}-${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 5, paddingBottom: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.card, { height: 90 }]} onPress={item.onPress}>
                <View>
                  <Ionicons name={item.icon as any} size={28} color="#007bff" />
                  {item.badge && item.badge > 0 && (
                    <View style={styles.draftBadge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {userLocation ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              showsUserLocation
            >
              <Marker
                coordinate={{
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude,
                }}
                title={t('your_location_marker')}
                pinColor="#007bff"
              />
              <Circle
                center={userLocation.coords}
                radius={1000}
                strokeColor="#007bff"
                strokeWidth={2}
                fillColor="rgba(0, 123, 255, 0.1)"
              />
              {nearbyReports.map(report => (
                <Marker
                  key={report.report_id}
                  coordinate={{
                    latitude: report.latitude,
                    longitude: report.longitude,
                  }}
                  title={report.description || ''}
                  pinColor="#dc3545"
                />
              ))}
            </MapView>
          ) : (
            <Text style={styles.mapText}>{t('fetching_location_reports')}</Text>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('logout_button')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeTitle: { fontSize: 28, fontWeight: 'bold', color: '#1c1c1e' },
  pointsText: { fontSize: 16, fontWeight: '600', color: '#007bff', marginTop: 4 },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 16 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: 'red', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  mapContainer: { flex: 1, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#dee2e6', overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },
  mapText: { color: '#6c757d', fontSize: 16 },
  card: { backgroundColor: '#ffffff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: 120, marginRight: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  cardTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#343a40', lineHeight: 14, marginTop: 5 },
  logoutButton: { backgroundColor: '#dc3545', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  logoutButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  draftBadge: { position: 'absolute', top: -5, right: -10, backgroundColor: '#ffc107', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
});
