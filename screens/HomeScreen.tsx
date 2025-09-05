import React from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// Define the navigation prop type for this screen
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  //Get the navigation object
  const navigation = useNavigation<HomeScreenNavigationProp>();
  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            {/* 1. Map Placeholder */}
            <View style={styles.mapContainer}>
                <Text style={styles.mapText}>Map will be displayed here</Text>
            </View>

            {/* 2. Action Buttons Container */}
            <View style={styles.buttonContainer}>
                <Button
                    title="File a New Report"
                    onPress={() => navigation.navigate('ReportForm')}
                />
                <Button
                    title="View Past Reports"
                    color="#6f42c1" // A different color for distinction
                    onPress={() => navigation.navigate('ViewReports')}
                />
            </View>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  mapContainer: {
    flex: 1, // This will make the map container take up the available space
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  mapText: {
    color: '#6c757d',
    fontSize: 16,
  },
  buttonContainer: {
    gap: 15, // Adds space between the buttons
  },
});