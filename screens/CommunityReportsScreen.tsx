import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, LayoutAnimation, Platform, UIManager, 
  ActivityIndicator, Alert, RefreshControl, TextInput, Modal, Button, TouchableOpacity 
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { useTranslation } from 'react-i18next';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Report = {
  report_id: number;
  description: string;
  user_id: string;
  upvote_count: number;
  department_id: number;
  image_url: string; 
  status: string;
  created_at: string;
  department: { name: string } | null;
  latitude: number;
  longitude: number;
};

type Department = { id: number; name: string };

const getStatusColors = (status: string) => {
  switch (status) {
    case 'Submitted': return { bg: '#e0f7fa', text: '#007bff' };
    case 'Acknowledged': return { bg: '#fff3cd', text: '#ffc107' };
    case 'Completed': return { bg: '#d4edda', text: '#28a745' };
    default: return { bg: '#e9ecef', text: '#6c757d' };
  }
};

const ReportListItem = ({ report, currentUser }: { report: Report, currentUser: User | null }) => {
  const { t } = useTranslation();
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [optimisticCount, setOptimisticCount] = useState(report.upvote_count);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingUpvote, setLoadingUpvote] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const colors = getStatusColors(report.status);

  useEffect(() => {
    if (!currentUser) { setLoadingUpvote(false); return; }
    const checkUpvoteStatus = async () => {
      const { count } = await supabase
        .from('report_upvotes')
        .select('*', { count: 'exact', head: true })
        .match({ report_id: report.report_id, user_id: currentUser.id });
      if (count && count > 0) setIsUpvoted(true);
      setLoadingUpvote(false);
    };
    checkUpvoteStatus();
  }, [currentUser, report.report_id]);

  const handleUpvote = async (event: any) => {
    event.stopPropagation();
    if (!currentUser) {
      Alert.alert(t('action_not_allowed'), t('login_to_upvote'));
      return;
    }
    if (currentUser.id === report.user_id) {
      Alert.alert(t('action_not_allowed'), t('cannot_upvote_own_report'));
      return;
    }

    const originalUpvotedState = isUpvoted;
    const originalCount = optimisticCount;

    setIsUpvoted(!originalUpvotedState);
    setOptimisticCount(originalUpvotedState ? originalCount - 1 : originalCount + 1);

    const action = originalUpvotedState
      ? supabase.from('report_upvotes').delete().match({ report_id: report.report_id, user_id: currentUser.id })
      : supabase.from('report_upvotes').insert({ report_id: report.report_id, user_id: currentUser.id });

    const { error } = await action;
    if (error) {
      Alert.alert(t('error'), t('upvote_sync_error'));
      setIsUpvoted(originalUpvotedState);
      setOptimisticCount(originalCount);
    }
  };

  const departmentName = report.department?.name || t('all_departments');

  return (
    <View style={styles.itemOuterContainer}>
      <TouchableOpacity style={styles.itemContainer} onPress={toggleExpand} activeOpacity={0.8}>
        <View style={styles.itemImageContainer}>
          <Image 
            source={{ uri: report.image_url }} 
            style={styles.itemImage}
            onLoadEnd={() => setImageLoading(false)} 
            onError={() => setImageLoading(false)}
          />
          {imageLoading && (
            <View style={styles.imageOverlay}>
              <ActivityIndicator size="small" color="#6c757d" />
            </View>
          )}
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemDepartment}>{departmentName}</Text>
          <Text style={styles.descriptionText} numberOfLines={1}>{report.description}</Text>
          {(optimisticCount > 0) && <Text style={styles.countText}>{t('upvotes', { count: optimisticCount })}</Text>}
        </View>

        <TouchableOpacity style={[styles.upvoteButton, isUpvoted && styles.upvotedButton]} onPress={handleUpvote} disabled={loadingUpvote}>
          {loadingUpvote ? <ActivityIndicator size="small" /> : <Text style={[styles.upvoteText, isUpvoted && { color: '#fff' }]}>👍</Text>}
        </TouchableOpacity>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedView}>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>{t('status_label')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.statusText, { color: colors.text }]}>{t(`status_${report.status.toLowerCase()}`)}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>{t('reported_on')}</Text>
            <Text style={styles.detailValue}>{new Date(report.created_at).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.fullDescription}>{report.description}</Text>
          <View style={styles.miniMapContainer}>
            <MapView style={styles.miniMap} scrollEnabled={false} zoomEnabled={false} initialRegion={{ latitude: report.latitude, longitude: report.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}>
              <UrlTile urlTemplate={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${process.env.EXPO_PUBLIC_MAPTILER_API_KEY}`} maximumZ={19} />
              <Marker coordinate={{ latitude: report.latitude, longitude: report.longitude }} />
            </MapView>
          </View>
        </View>
      )}
    </View>
  );
};

export default function CommunityReportsScreen() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'upvote_count'>('created_at');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null); 
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from('departments').select('id, name');
      if (error) console.error("Failed to fetch departments:", error);
      else if (data) setDepartments(data);
    };
    fetchDepartments();
  }, []);

  const fetchReports = useCallback(async () => {
    if (!reports.length && !refreshing) setIsLoading(true);
    else setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      const currentUserId = user?.id || null;

      let query = supabase.from('reports').select(`*, department:departments(name)`);
      if (currentUserId) query = query.neq('user_id', currentUserId);

      if (searchQuery) query = query.ilike('description', `%${searchQuery}%`);
      if (selectedStatus) query = query.eq('status', selectedStatus);
      if (selectedDeptId) query = query.eq('department_id', selectedDeptId);
      if (selectedDateRange) {
        const now = new Date();
        let startDate = new Date();
        if (selectedDateRange === 'week') startDate.setDate(now.getDate() - 7);
        else if (selectedDateRange === 'month') startDate.setMonth(now.getMonth() - 1);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error: fetchError } = await query.order(sortBy, { ascending: false });
      if (fetchError) throw fetchError;

      const reportsData = (data || []).map(report => {
        const department = (report as any).department;
        return { ...report, department: department && Array.isArray(department) ? department[0] : department };
      });

      setReports(reportsData || []);
    } catch (err: any) {
      Alert.alert(t('error'), t('fetch_community_reports_error'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedStatus, selectedDeptId, selectedDateRange, refreshing, sortBy, t]);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
      const channel = supabase
        .channel('public:reports-community')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchReports())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }, [fetchReports])
  );

  const onRefresh = () => { fetchReports(); };
  const applyFiltersAndCloseModal = () => { fetchReports(); setFilterModalVisible(false); };
  const clearFilters = () => {
    setSelectedStatus(null);
    setSelectedDeptId(null);
    setSelectedDateRange(null);
    setSearchQuery('');
    setSortBy('created_at'); 
    setFilterModalVisible(false);
  };

  if (isLoading && !refreshing) return <SafeAreaView style={styles.safeArea}><ActivityIndicator style={{ flex: 1 }} size="large" color="#007bff" /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
          renderItem={({ item }) => <ReportListItem report={item} currentUser={currentUser} />}
          keyExtractor={(item) => item.report_id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('no_community_reports_found')}</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007bff"]}/>}
          contentContainerStyle={{paddingBottom: 20}}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('filter_reports_title')}</Text>
            
            <Text style={styles.filterLabel}>{t('status_label')}</Text>
            <Picker selectedValue={selectedStatus} onValueChange={(itemValue) => setSelectedStatus(itemValue)}>
              <Picker.Item label={t('all_status')} value={null} />
              <Picker.Item label={t('status_submitted')} value="Submitted" />
              <Picker.Item label={t('status_acknowledged')} value="Acknowledged" />
              <Picker.Item label={t('status_completed')} value="Completed" />
            </Picker>

            <Text style={styles.filterLabel}>{t('department_label')}</Text>
            <Picker selectedValue={selectedDeptId} onValueChange={(itemValue) => setSelectedDeptId(itemValue)}>
              <Picker.Item label={t('all_departments')} value={null} />
              {departments.map(dept => <Picker.Item key={dept.id} label={dept.name} value={dept.id} />)}
            </Picker>

            <Text style={styles.filterLabel}>{t('date_range_label')}</Text>
            <Picker selectedValue={selectedDateRange} onValueChange={(itemValue) => setSelectedDateRange(itemValue)}>
              <Picker.Item label={t('all_time')} value={null} />
              <Picker.Item label={t('this_week')} value="week" />
              <Picker.Item label={t('this_month')} value="month" />
            </Picker>

            <Text style={styles.filterLabel}>{t('sort_by_label')}</Text>
            <Picker selectedValue={sortBy} onValueChange={(itemValue) => setSortBy(itemValue)}>
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
  container: { flex: 1, paddingHorizontal: 0, paddingTop: 20 },
  descriptionText: { flex: 1, fontSize: 16, color: '#343a40', marginRight: 10 },
  countText: { fontSize: 12, color: '#6c757d', marginTop: 4 },
  upvoteButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#e9ecef', borderRadius: 20, minWidth: 90, alignItems: 'center' },
  upvotedButton: { backgroundColor: '#007bff' },
  upvoteText: { color: '#495057', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#6c757d' },
  controlsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 20 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, height: 44, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, paddingHorizontal: 15 },
  searchButton: { padding: 10, backgroundColor: '#007bff', height: '100%', justifyContent: 'center', borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  filterButtonIcon: { marginLeft: 10, padding: 8 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#f8f9fa', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  filterLabel: { fontSize: 16, fontWeight: '600', color: '#495057', marginTop: 10 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  itemOuterContainer: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 12, marginHorizontal: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  itemContainer: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 0, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemImageContainer: { width: 60, height: 60, borderRadius: 8, marginRight: 15, overflow: 'hidden', backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center' },
  itemImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  itemContent: { flex: 1, flexDirection: 'column' },
  itemDepartment: { fontWeight: 'bold', marginBottom: 3, fontSize: 14 },
  expandedView: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#dee2e6' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailKey: { fontWeight: 'bold', marginRight: 8 },
  detailValue: { flexShrink: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontWeight: '600' },
  fullDescription: { marginTop: 10, fontSize: 14, color: '#495057' },
  miniMapContainer: { height: 120, marginTop: 10, borderRadius: 12, overflow: 'hidden' },
  miniMap: { flex: 1 },
});
