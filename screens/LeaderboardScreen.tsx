import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

// Define the navigation prop type for this screen
type LeaderboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Leaderboard'>;

// Define the type for a single leaderboard entry
type LeaderboardEntry = {
    name: string | null;
    email: string;
    civic_points: number;
};

export default function LeaderboardScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation<LeaderboardScreenNavigationProp>();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // Query the 'leaderboard' view you created
                const { data, error } = await supabase
                    .from('leaderboard')
                    .select('name, email, civic_points')
                    .limit(50); // Fetch the top 50 users

                if (error) throw error;
                if (data) setLeaderboard(data);

            } catch (err: any) {
                setError(t('leaderboard_load_failed') || err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    // Component to render each item in the list
    const renderItem = ({ item, index }: { item: LeaderboardEntry, index: number }) => (
        <View style={styles.itemContainer}>
            <View style={styles.rankContainer}>
                <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <Text style={styles.emailText}>{item.name || item.email}</Text>
            <Text style={styles.pointsText}>{item.civic_points} {t('points_unit')}</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#007bff" />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.errorText}>{t('leaderboard_load_failed')}</Text>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('top_contributors')}</Text>
                    <View style={{ width: 40 }} /> {/* Spacer */}
                </View>

                <FlatList
                    data={leaderboard}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => `${item.email}-${index}`}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    backButton: {
        fontSize: 32,
        color: '#1c1c1e',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1c1c1e',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    rankContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#495057',
    },
    emailText: {
        flex: 1,
        fontSize: 16,
        color: '#343a40',
    },
    pointsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007bff',
    },
    errorText: {
        fontSize: 16,
        color: '#dc3545',
    },
});
