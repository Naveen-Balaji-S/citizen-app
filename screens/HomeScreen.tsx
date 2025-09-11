import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

// Define the navigation prop type for this screen
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

// A simple User Icon component
const UserIcon = () => (
    <View style={styles.userIcon}>
        <Text style={styles.userIconText}>👤</Text>
    </View>
);

export default function HomeScreen() {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
            }
            setLoading(false);
        };

        fetchUser();
    }, []);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert("Error", "Failed to log out. Please try again.");
        }
        else{
            navigation.navigate('Login');
        }
        // The AuthProvider will handle navigation back to the login screen
    };

    const showUserProfile = () => {
        if (user) {
            Alert.alert("User Profile", `You are logged in as: \n${user.email}`);
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
                {/* 1. Header with User Info */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeTitle}>Dashboard</Text>
                        <Text style={styles.welcomeSubtitle}>Welcome back!</Text>
                    </View>
                    <TouchableOpacity onPress={showUserProfile}>
                        <UserIcon />
                    </TouchableOpacity>
                </View>

                {/* 2. Map Placeholder */}
                <View style={styles.mapContainer}>
                    <Text style={styles.mapText}>Map will be displayed here</Text>
                </View>

                {/* 3. Action Cards */}
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
                
                {/* 4. Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f2f5', // A soft grey background
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1c1c1e',
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#6c757d',
    },
    userIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userIconText: {
        fontSize: 24,
    },
    mapContainer: {
        flex: 0.7, // Assigns a proportional height, smaller than the cards area
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#dee2e6'
    },
    mapText: {
        color: '#6c757d',
        fontSize: 16,
    },
    cardContainer: {
        flex: 1, // Takes up the remaining space
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '48%', // Each card takes up slightly less than half the width
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardIcon: {
        fontSize: 32,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#343a40',
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    logoutButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

