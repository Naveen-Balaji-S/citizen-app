// hooks/usePushTokens.ts
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../lib/supabaseClient';

// This hook returns the Expo push token (string | null)
// and makes sure the notification handler is ready for foreground alerts.
export default function usePushTokens() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return;
      }

      // Ask for permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions!');
        return;
      }

      // Get the token that Expo can use to send notifications
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);

      // Optional: store token in your Supabase table if needed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          expo_push_token: token,
        });
      }
    };

    registerForPushNotificationsAsync();

    // Foreground listener – fires when a notification is received while the app is open
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 In-app notification:', notification);
      // You could display a custom modal/toast here if you like.
    });

    return () => {
      foregroundSub.remove();
    };
  }, []);

  return expoPushToken;
}
