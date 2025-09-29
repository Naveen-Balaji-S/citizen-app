import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTranslation } from 'react-i18next';

type Draft = {
  id: string;
  description?: string;
  image?: any;
  location?: { latitude: number; longitude: number };
  departmentId?: number;
  recordedAudioUri?: string;
  savedAt: string;
};

type DraftsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Drafts'>;

const DraftsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<DraftsScreenNavigationProp>();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDrafts = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const draftKeys = keys.filter(key => key.startsWith('@draft_report_'));
      const items = await AsyncStorage.multiGet(draftKeys);
      const loadedDrafts: Draft[] = items
        .map(item => JSON.parse(item[1] || '{}'))
        .filter(d => d.id)
        .sort((a, b) => parseInt(b.id) - parseInt(a.id));
      setDrafts(loadedDrafts);
    } catch (e) {
      Alert.alert(t('error'), t('drafts.load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadDrafts();
    }, [])
  );

  const handleDelete = async (id: string) => {
    Alert.alert(
      t('drafts.delete_title'),
      t('drafts.delete_message'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('drafts.delete_button'),
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(`@draft_report_${id}`);
              loadDrafts();
            } catch (e) {
              Alert.alert(t('error'), t('drafts.delete_error'));
            }
          },
        },
      ]
    );
  };

  const handleEditDraft = (draft: Draft) => {
    navigation.navigate('ReportForm', { draft });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('drafts.title')}</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <FlatList
            data={drafts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description || t('drafts.no_description')}
                </Text>
                <Text style={styles.time}>
                  {t('drafts.saved_at', { time: new Date(item.savedAt).toLocaleString() })}
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#28a745' }]}
                    onPress={() => handleEditDraft(item)}
                  >
                    <Text style={styles.buttonText}>{t('drafts.edit_continue')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.buttonText}>{t('drafts.delete_button')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('drafts.empty')}</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { flex: 1, padding: 15 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  description: { fontSize: 16, fontWeight: '500', color: '#343a40', marginBottom: 8 },
  time: { fontSize: 12, color: '#6c757d', marginBottom: 15 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  buttonText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#6c757d' },
});

export default DraftsScreen;
