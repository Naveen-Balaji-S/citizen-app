// lib/notification.ts
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, // ✅ new for SDK 51+
    shouldShowList: true,   // ✅ new for SDK 51+
  }),
});

export const showError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  Alert.alert('Error', message);
};
