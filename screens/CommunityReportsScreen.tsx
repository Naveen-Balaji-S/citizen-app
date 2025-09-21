import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

// --- Type Definitions ---
type Report = {
    report_id: number;
    description: string;
    user_id: string;
    upvote_count: number;
    department_id: number;
};

type Department = { id: number; name: string; };

// --- A Reusable Component for Each Report Item ---
const ReportListItem = ({ report, currentUser }: { report: Report, currentUser: User | null }) => {
    const [isUpvoted, setIsUpvoted] = useState(false);
    const [loadingUpvoteStatus, setLoadingUpvoteStatus] = useState(true);

    useEffect(() => {
        if (!currentUser) { setLoadingUpvoteStatus(false); return; }
        const checkUpvoteStatus = async () => {
            const { count, error } = await supabase
                .from('report_upvotes')
                .select('*', { count: 'exact', head: true })
                .match({ report_id: report.report_id, user_id: currentUser.id });
            if (!error && count && count > 0) setIsUpvoted(true);
            setLoadingUpvoteStatus(false);
        };
        checkUpvoteStatus();
    }, [currentUser, report.report_id]);

    const handleUpvote = async () => {
        if (!currentUser) { Alert.alert("Please log in to upvote."); return; }

        const action = isUpvoted
            ? supabase.from('report_upvotes').delete().match({ report_id: report.report_id, user_id: currentUser.id })
            : supabase.from('report_upvotes').insert({ report_id: report.report_id, user_id: currentUser.id });

        const { error } = await action;
        if (!error) setIsUpvoted(!isUpvoted);
    };

    return (
        <View style={styles.itemContainer}>
            <View style={{ flex: 1 }}>
                <Text style={styles.descriptionText}>{report.description}</Text>
                {report.upvote_count > 0 && <Text style={styles.countText}>{report.upvote_count} upvotes</Text>}
            </View>
            <TouchableOpacity style={[styles.upvoteButton, isUpvoted && styles.upvotedButton]} onPress={handleUpvote} disabled={loadingUpvoteStatus}>
                {loadingUpvoteStatus ? <ActivityIndicator size="small" /> : <Text style={[styles.upvoteText, isUpvoted && { color: '#fff' }]}>👍 Upvote</Text>}
            </TouchableOpacity>
        </View>
    );
};

// --- The Main Screen Component ---
export default function CommunityReportsScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'CommunityReports'>>();
    const [reports, setReports] = useState<Report[]>([]);
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<number | 'all'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const { data: deptData } = await supabase.from('departments').select('id, name');
            if (deptData) setDepartments(deptData);

            if (user) {
                // Fetch ONLY reports that are NOT from the current user
                const { data: reportData } = await supabase
                    .from('reports')
                    .select('report_id, description, user_id, upvote_count, department_id')
                    .neq('user_id', user.id) // <-- KEY CHANGE HERE
                    .order('created_at', { ascending: false })
                    .limit(100);
                
                if (reportData) {
                    setReports(reportData);
                    setFilteredReports(reportData);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    // Effect to apply the department filter
    useEffect(() => {
        if (selectedDeptId === 'all') {
            setFilteredReports(reports);
        } else {
            setFilteredReports(reports.filter(r => r.department_id === selectedDeptId));
        }
    }, [selectedDeptId, reports]);

    if (loading) {
        return <SafeAreaView style={styles.safeArea}><ActivityIndicator style={{ marginTop: 50 }} size="large" color="#007bff" /></SafeAreaView>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                    <TouchableOpacity style={[styles.filterButton, selectedDeptId === 'all' && styles.activeFilterButton]} onPress={() => setSelectedDeptId('all')}>
                        <Text style={[styles.filterText, selectedDeptId === 'all' && styles.activeFilterText]}>All</Text>
                    </TouchableOpacity>
                    {departments.map(dept => (
                        <TouchableOpacity key={dept.id} style={[styles.filterButton, selectedDeptId === dept.id && styles.activeFilterButton]} onPress={() => setSelectedDeptId(dept.id)}>
                            <Text style={[styles.filterText, selectedDeptId === dept.id && styles.activeFilterText]}>{dept.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                </View>
                
                <FlatList
                    style={{ flex: 1 }}
                    data={filteredReports}
                    renderItem={({ item }) => <ReportListItem report={item} currentUser={currentUser} />}
                    keyExtractor={(item) => item.report_id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 10 }}
                />
            </View>
        </SafeAreaView>
    );
}

// --- Styles (Identical to previous version, just no sectionHeader) ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    backButton: { fontSize: 32, color: '#1c1c1e' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1c1c1e' },
    itemContainer: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    descriptionText: { flex: 1, fontSize: 16, color: '#343a40', marginRight: 10 },
    countText: { fontSize: 12, color: '#6c757d', marginTop: 4 },
    upvoteButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#e9ecef', borderRadius: 20, minWidth: 90, alignItems: 'center' },
    upvotedButton: { backgroundColor: '#007bff' },
    upvoteText: { color: '#495057', fontWeight: 'bold' },
    filterContainer: { flexDirection: 'row', marginBottom: 15, paddingVertical: 5, height: 40 },
    filterButton: { height: 34, paddingVertical: 6, paddingHorizontal: 16, backgroundColor: '#e9ecef', borderRadius: 18, marginRight: 10,justifyContent: 'center' },
    activeFilterButton: { backgroundColor: '#007bff' },
    filterText: { color: '#495057', fontWeight: '500',  fontSize: 14,  },
    activeFilterText: { color: '#ffffff' },
});