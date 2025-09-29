import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, StyleSheet, FlatList, Image,
  ActivityIndicator, Alert, RefreshControl,
  TextInput, Modal, Button, TouchableOpacity,
  LayoutAnimation, Platform, UIManager
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import MapView, { Marker, UrlTile } from 'react-native-maps';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Report {
  report_id: number;
  description: string;
  image_url: string;
  status: string;
  created_at: string;
  upvote_count: number;
  latitude: number;
  longitude: number;
  department: { name: string } | null;
}

const getStatusColors = (status: string) => {
  switch (status) {
    case 'Submitted': return { bg: '#e0f7fa', text: '#007bff' };
    case 'Acknowledged': return { bg: '#fff3cd', text: '#ffc107' };
    case 'Completed': return { bg: '#d4edda', text: '#28a745' };
    default: return { bg: '#e9ecef', text: '#6c757d' };
  }
};

const MyReportListItem = ({ item }: { item: Report }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const colors = getStatusColors(item.status);
  const statusKey = `status_${item.status.toLowerCase()}` as const;

  return (
    <View style={styles.itemOuterContainer}>
      <TouchableOpacity style={styles.itemContainer} onPress={toggleExpand} activeOpacity={0.8}>
        <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        <View style={styles.itemContent}>
          <Text style={styles.itemDepartment}>{item.department?.name || t('general_department')}</Text>
          <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
        </View>
        <View style={styles.upvoteSection}>
          <Text style={styles.upvoteEmoji}>👍</Text>
          <Text style={styles.upvoteCountText}>{item.upvote_count}</Text>
        </View>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#6c757d" />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedView}>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>{t('status_label')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.statusText, { color: colors.text }]}>{t(statusKey)}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>{t('reported_on')}</Text>
            <Text style={styles.detailValue}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
          <Text style={styles.fullDescription}>{item.description}</Text>
          <View style={styles.miniMapContainer}>
            <MapView
              style={styles.miniMap}
              scrollEnabled={false}
              zoomEnabled={false}
              initialRegion={{
                latitude: item.latitude,
                longitude: item.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005
              }}
            >
              <UrlTile urlTemplate={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${process.env.EXPO_PUBLIC_MAPTILER_API_KEY}`} maximumZ={19} />
              <Marker coordinate={{ latitude: item.latitude, longitude: item.longitude }} />
            </MapView>
          </View>
        </View>
      )}
    </View>
  );
};

export default function ViewReportsScreen() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'upvote_count'>('created_at');

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!reports.length && !refreshing) setIsLoading(true);
    else if (!refreshing) setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found.");

      let query = supabase
        .from('reports')
        .select(`report_id, description, image_url, status, created_at, upvote_count, latitude, longitude, department:departments(name)`)
        .eq('user_id', user.id);

      if (searchQuery) query = query.ilike('description', `%${searchQuery}%`);
      if (selectedStatus) query = query.eq('status', selectedStatus);
      if (selectedDeptId) query = query.eq('department_id', selectedDeptId);
      if (selectedDateRange) {
        const now = new Date();
        const startDate = new Date();
        if (selectedDateRange === 'week') startDate.setDate(now.getDate() - 7);
        else if (selectedDateRange === 'month') startDate.setMonth(now.getMonth() - 1);
        query = query.gte('created_at', startDate.toISOString());
      }

      query = query.order(sortBy, { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const reportsData = (data || []).map(report => {
        const department = (report as any).department;
        return {
          ...report,
          department: department && Array.isArray(department) ? department[0] : department,
        };
      });

      setReports(reportsData);

    } catch (err: any) {
      Alert.alert(t('error'), t('fetch_reports_error'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedStatus, selectedDeptId, selectedDateRange, sortBy, t]);

  useEffect(() => {
    const loadDepartments = async () => {
      const { data } = await supabase.from('departments').select('id, name');
      setDepartments(data || []);
    };
    loadDepartments();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReports();

      const channel = supabase
        .channel('public:reports-user-specific')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reports' },
          () => fetchReports()
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }, [fetchReports])
  );

  const onRefresh = () => { setRefreshing(true); fetchReports(); };
  const clearFilters = () => {
    setSelectedStatus(null);
    setSelectedDeptId(null);
    setSelectedDateRange(null);
    setSearchQuery('');
    setFilterModalVisible(false);
  };
  const applyFiltersAndCloseModal = () => { fetchReports(); setFilterModalVisible(false); };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>{t('loading_reports')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('view_reports_title')}</Text>

        <View style={styles.controlsContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_by_description_placeholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={fetchReports}
            />
            <TouchableOpacity style={styles.searchButton} onPress={fetchReports}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.filterButtonIcon} onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="filter" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={reports}
          renderItem={({ item }) => <MyReportListItem item={item} />}
          keyExtractor={(item) => item.report_id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>{t('no_reports_yet')}</Text></View>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007bff"]} />}
        />
      </View>

      <Modal animationType="slide" transparent visible={filterModalVisible} onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('filter_reports_title')}</Text>

            <Text style={styles.filterLabel}>{t('status_label').replace(':', '')}</Text>
            <Picker selectedValue={selectedStatus} onValueChange={setSelectedStatus}>
              <Picker.Item label={t('all_status')} value={null} />
              <Picker.Item label={t('status_submitted')} value="Submitted" />
              <Picker.Item label={t('status_acknowledged')} value="Acknowledged" />
              <Picker.Item label={t('status_completed')} value="Completed" />
            </Picker>

            <Text style={styles.filterLabel}>{t('department_label')}</Text>
            <Picker selectedValue={selectedDeptId} onValueChange={setSelectedDeptId}>
              <Picker.Item label={t('all_departments')} value={null} />
              {departments.map(d => <Picker.Item key={d.id} label={d.name} value={d.id} />)}
            </Picker>

            <Text style={styles.filterLabel}>{t('date_range_label')}</Text>
            <Picker selectedValue={selectedDateRange} onValueChange={setSelectedDateRange}>
              <Picker.Item label={t('all_time')} value={null} />
              <Picker.Item label={t('this_week')} value="week" />
              <Picker.Item label={t('this_month')} value="month" />
            </Picker>

            <Text style={styles.filterLabel}>{t('sort_by_label')}</Text>
            <Picker selectedValue={sortBy} onValueChange={(itemValue: 'created_at' | 'upvote_count') => setSortBy(itemValue)}>
              <Picker.Item label={t('newest_first')} value="created_at" />
              <Picker.Item label={t('most_upvoted')} value="upvote_count" />
            </Picker>

            <View style={styles.modalButtonContainer}>
              <Button title={t('clear_filters_button')} onPress={clearFilters} color="#6c757d" />
              <Button title={t('apply_button')} onPress={applyFiltersAndCloseModal} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { flex: 1, padding: 15 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#6c757d' },
  controlsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, height: 44, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  searchInput: { flex: 1, fontSize: 16, paddingHorizontal: 15 },
  searchButton: { padding: 10, backgroundColor: '#007bff', height: '100%', justifyContent: 'center', borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  filterButtonIcon: { marginLeft: 10, padding: 8 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#f8f9fa', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  filterLabel: { fontSize: 16, fontWeight: '600', color: '#495057', marginTop: 10 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  itemOuterContainer: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, marginHorizontal: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  itemContainer: { paddingVertical: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15, backgroundColor: '#e9ecef' },
  itemContent: { flex: 1 },
  itemDepartment: { fontSize: 13, fontWeight: 'bold', color: '#007bff', marginBottom: 4 },
  descriptionText: { fontSize: 16, color: '#343a40', flexShrink: 1 },
  upvoteSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9ecef', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10, marginLeft: 10 },
  upvoteEmoji: { fontSize: 16 },
  upvoteCountText: { fontSize: 16, color: '#343a40', fontWeight: 'bold', marginLeft: 5 },
  expandedView: { paddingHorizontal: 15, paddingBottom: 15, borderTopWidth: 1, borderTopColor: '#e9ecef' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  detailKey: { fontSize: 14, color: '#6c757d', fontWeight: '600' },
  detailValue: { fontSize: 14, color: '#343a40', fontWeight: '500' },
  statusBadge: { borderRadius: 12, paddingVertical: 3, paddingHorizontal: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  fullDescription: { fontSize: 15, color: '#343a40', marginTop: 15, lineHeight: 22 },
  miniMapContainer: { height: 180, borderRadius: 8, overflow: 'hidden', marginTop: 15, backgroundColor: '#e9ecef' },
  miniMap: { ...StyleSheet.absoluteFillObject },
  emptyText: { fontSize: 16, color: '#6c757d' },
});