import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation , CommonActions} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import i18n from '../lib/i18n'; // 👈 MODIFIED: Import i18n

type SuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Success'>;

export default function SuccessScreen() {
  const navigation = useNavigation<SuccessScreenNavigationProp>();

    // This effect runs once when the screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      // After 2 seconds, reset the navigation stack to the Home screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }, 2000); // 2000 milliseconds = 2 seconds

    // Clear the timer if the component is unmounted
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅</Text>
      <Text style={styles.text}>{i18n.t('report_submitted_success')}</Text> {/* 👈 MODIFIED: Translated */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  text: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
});
