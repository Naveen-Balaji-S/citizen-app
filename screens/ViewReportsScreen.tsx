import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { API_URL } from '../config/apiConfig';
import { authenticatedFetch } from '../api/apiService';
// --- CONFIGURATION ---
// This MUST be the same IP address you used in your ReportIssueScreen.tsx

// This is the TypeScript type for a single report object
interface Report {
  report_id: number;
  department: string;
  description: string;
  image_url: string;
  status: string;
  created_at: string;
}

// This is a small component to render one report item in the list
const ReportItem = ({ item }: { item: Report }) => (
  <View style={styles.itemContainer}>
    <Image source={{ uri: item.image_url }} style={styles.image} />
    <View style={styles.textContainer}>
      <Text style={styles.department}>{item.department}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>
      <Text style={styles.date}>
        Reported on: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  </View>
);

export default function ViewReportsScreen() {
  // 1. State for storing the list of reports and the loading status
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. useEffect hook to fetch data when the screen loads
  useEffect(() => {
    const fetchReports = async () => {
      try {
        // We now use our helper, which automatically adds the login token.
        const data: Report[] = await authenticatedFetch('/api/reports');
        setReports(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []); // The empty array [] means this effect runs only once when the screen opens

  // 3. Render a loading indicator while fetching
  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading Reports...</Text>
      </View>
    );
  }

  // 4. Render an error message if something went wrong
  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }
  
  // 5. Render the list of reports if everything is successful
  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={({ item }) => <ReportItem item={item} />}
        keyExtractor={(item) => item.report_id.toString()}
        ListEmptyComponent={
          <View style={styles.center}>
             <Text>You have not submitted any reports yet.</Text>
          </View>
        }
      />
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f0f2f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.4,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  department: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffa500', // Orange color for status
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});