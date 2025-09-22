import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import i18n from '../lib/i18n';

export default function NotificationsScreen() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setItems(data);

      // Mark all unread as read
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('is_read', false);
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      {/* This screen does not have any hardcoded user-facing strings to translate.
        The content (title, body, time) is fetched dynamically from the database.
      */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  body: { fontSize: 14, color: '#555' },
  time: { fontSize: 12, color: '#888', marginTop: 4 },
});
