import React, { useEffect, useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, Image, 
    ActivityIndicator, Alert, SafeAreaView, RefreshControl 
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';

// This is the TypeScript type for a single report object from your database
interface Report {
    report_id: number;
    description: string;
    image_url: string;
    status: string;
    created_at: string;
    department: { name: string } | null;
}

// Map status to badge background and text color
const getStatusColors = (status: string) => {
    switch (status) {
        case 'Submitted':
            return { bg: '#cce5ff', text: '#004085' };
        case 'Acknowledged':
            return { bg: '#fff3cd', text: '#856404' };
        case 'Completed':
            return { bg: '#d4edda', text: '#155724' };
        default:
            return { bg: '#e2e3e5', text: '#6c757d' };
    }
};

// This is a small component to render one report item in the list
const ReportItem = ({ item }: { item: Report }) => {
    const colors = getStatusColors(item.status);

    return (
        <View style={styles.itemContainer}>
            <Image 
                source={{ uri: item.image_url }} 
                style={styles.image} 
                onError={() => console.log('Failed to load image:', item.image_url)} 
            />
            <View style={styles.textContainer}>
                <Text style={styles.department}>{item.department?.name || 'N/A'}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
                <Text style={styles.date}>
                    Reported on: {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
        </View>
    );
};

export default function ViewReportsScreen() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReports = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found.");

            const { data, error: fetchError } = await supabase
                .from('reports')
                .select(`
                    report_id,
                    description,
                    image_url,
                    status,
                    created_at,
                    department:departments(name) 
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            
            // Corrected: Use a code block with explicit 'return' statement and safer type handling
            const reportsData = (data || []).map(report => {
                const department = (report as any).department;
                let departmentObject = null;

                if (department && Array.isArray(department) && department.length > 0) {
                    departmentObject = department[0];
                } else if (department) {
                    departmentObject = department;
                }

                return {
                    ...report,
                    department: departmentObject || { name: 'Unknown' },
                };
            });

            setReports(reportsData);

        } catch (err: any) {
            Alert.alert("Error", "Could not fetch your reports. Please try again.");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchReports(); // Initial fetch

            const channel = supabase
                .channel('public:reports')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'reports' },
                    (payload) => {
                        console.log('Change received!', payload);
                        fetchReports();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchReports();
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Loading Your Reports...</Text>
            </View>
        );
    }
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Your Submitted Reports</Text>
                <FlatList
                    data={reports}
                    renderItem={({ item }) => <ReportItem item={item} />}
                    keyExtractor={(item, index) => item.report_id?.toString() || index.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>You haven't submitted any reports yet.</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007bff"]} />
                    }
                />
            </View>
        </SafeAreaView>
    );
}

// --- STYLES ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { flex: 1, padding: 15, },
    center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1c1c1e',
        marginBottom: 20,
    },
    itemContainer: { 
        flexDirection: 'row', 
        backgroundColor: '#fff', 
        padding: 15, 
        marginVertical: 8, 
        borderRadius: 12, 
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4,
    },
    image: { 
        width: 80, 
        height: 80, 
        borderRadius: 8, 
        marginRight: 15, 
        backgroundColor: '#e9ecef' 
    },
    textContainer: { flex: 1, justifyContent: 'center' },
    department: { fontSize: 18, fontWeight: 'bold', color: '#343a40' },
    description: { fontSize: 14, color: '#6c757d', marginVertical: 4, },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginRight: 5,
    },
    statusBadge: {
        borderRadius: 12,
        paddingVertical: 3,
        paddingHorizontal: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    date: { fontSize: 12, color: '#6c757d', marginTop: 8 },
    loadingText: { marginTop: 10, fontSize: 16, color: '#6c757d' },
    emptyText: { fontSize: 16, color: '#6c757d' },
});