import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';

// --- Type Definitions ---
type Report = {
    report_id: number;
    description: string;
    user_id: string;
    upvote_count: number;
    department_id: number;
};
type Department = { id: number; name: string; };

// --- A Reusable Component for Each Report Item (Simplified Logic) ---
const ReportListItem = ({ report, currentUser }: { report: Report, currentUser: User | null }) => {
    const { t } = useTranslation();
    const [isUpvoted, setIsUpvoted] = useState(false);
    const [optimisticCount, setOptimisticCount] = useState(report.upvote_count);
    const [loading, setLoading] = useState(true);

    // This effect runs once to check the initial upvote status
    useEffect(() => {
        if (!currentUser) { setLoading(false); return; }
        const checkUpvoteStatus = async () => {
            const { count } = await supabase
                .from('report_upvotes')
                .select('*', { count: 'exact', head: true })
                .match({ report_id: report.report_id, user_id: currentUser.id });

            if (count && count > 0) setIsUpvoted(true);
            setLoading(false);
        };
        checkUpvoteStatus();
    }, [currentUser, report.report_id]);

    // This is the new, direct handler. No debouncing.
    const handleUpvote = async () => {
        if (!currentUser) {
            Alert.alert(t("upvote_login_required"));
            return;
        }
        if (currentUser.id === report.user_id) {
            Alert.alert(t("upvote_not_allowed_title"), t("upvote_not_allowed_message"));
            return;
        }
        
        // --- Step 1: Optimistic UI Update ---
        const originalUpvotedState = isUpvoted;
        const originalCount = optimisticCount;
        
        setIsUpvoted(!originalUpvotedState);
        setOptimisticCount(originalUpvotedState ? originalCount - 1 : originalCount + 1);

        // --- Step 2: Perform Backend Action ---
        const action = originalUpvotedState
            ? supabase.from('report_upvotes').delete().match({ report_id: report.report_id, user_id: currentUser.id })
            : supabase.from('report_upvotes').insert({ report_id: report.report_id, user_id: currentUser.id });
        
        const { error } = await action;

        // --- Step 3: Revert UI on Failure ---
        if (error) {
            Alert.alert(t("error"), t("upvote_sync_error"));
            setIsUpvoted(originalUpvotedState);
            setOptimisticCount(originalCount);
        }
    };

    return (
        <View style={styles.itemContainer}>
            <View style={{ flex: 1 }}>
                <Text style={styles.descriptionText}>{report.description}</Text>
                {(optimisticCount > 0) && <Text style={styles.countText}>{t('upvote_count', { count: optimisticCount })}</Text>}
            </View>
            <TouchableOpacity style={[styles.upvoteButton, isUpvoted && styles.upvotedButton]} onPress={handleUpvote} disabled={loading}>
                {loading ? <ActivityIndicator size="small" /> : <Text style={[styles.upvoteText, isUpvoted && { color: '#fff' }]}>{t('upvote_button')}</Text>}
            </TouchableOpacity>
        </View>
    );
};


// --- The Main Screen Component ---
export default function CommunityReportsScreen() {
    const { t } = useTranslation();
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
                const { data: reportData } = await supabase
                    .from('reports')
                    .select('report_id, description, user_id, upvote_count, department_id')
                    .neq('user_id', user.id)
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

    useEffect(() => {
        if (selectedDeptId === 'all') {
            setFilteredReports(reports);
        } else {
            setFilteredReports(reports.filter((r: Report) => r.department_id === selectedDeptId));
        }
    }, [selectedDeptId, reports]);

    // This is the new component for the content above the list
    const renderListHeader = () => (
        <>
            <View style={styles.header}>
                <Text style={styles.title}>{t('community_reports_title')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                <TouchableOpacity style={[styles.filterButton, selectedDeptId === 'all' && styles.activeFilterButton]} onPress={() => setSelectedDeptId('all')}>
                    <Text style={[styles.filterText, selectedDeptId === 'all' && styles.activeFilterText]}>{t('all_departments')}</Text>
                </TouchableOpacity>
                {departments.map(dept => (
                    <TouchableOpacity key={dept.id} style={[styles.filterButton, selectedDeptId === dept.id && styles.activeFilterButton]} onPress={() => setSelectedDeptId(dept.id)}>
                        <Text style={[styles.filterText, selectedDeptId === dept.id && styles.activeFilterText]}>{dept.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </>
    );

    if (loading) {
        return <SafeAreaView style={styles.safeArea}><ActivityIndicator style={{ marginTop: 50 }} size="large" color="#007bff" /></SafeAreaView>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* The entire screen is now the FlatList */}
            <FlatList
                data={filteredReports}
                renderItem={({ item }) => <ReportListItem report={item} currentUser={currentUser} />}
                keyExtractor={(item) => item.report_id.toString()}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={renderListHeader} // 👈 This renders the header and filters
                contentContainerStyle={{ paddingHorizontal: 20 }}
                ListEmptyComponent={<Text style={styles.emptyText}>{t('no_reports_found')}</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1c1c1e' },
    itemContainer: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    descriptionText: { flex: 1, fontSize: 16, color: '#343a40', marginRight: 10 },
    countText: { fontSize: 12, color: '#6c757d', marginTop: 4 },
    upvoteButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#e9ecef', borderRadius: 20, minWidth: 90, alignItems: 'center' },
    upvotedButton: { backgroundColor: '#007bff' },
    upvoteText: { color: '#495057', fontWeight: 'bold' },
    filterContainer: { flexDirection: 'row', marginBottom: 15, height: 40 },
    filterButton: { height: 34, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#e9ecef', borderRadius: 18, marginRight: 10 },
    activeFilterButton: { backgroundColor: '#007bff' },
    filterText: { color: '#495057', fontWeight: '500', fontSize: 14 },
    activeFilterText: { color: '#ffffff' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#6c757d' },
});
