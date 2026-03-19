import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import type { Alert } from './useAlerts';

const SEEN_KEY = 'seen-alert-ids';

// Lazy-load expo-notifications — crashes in Expo Go where the native module is missing
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  console.warn('expo-notifications not available — push notifications disabled');
}

async function loadSeenIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(SEEN_KEY);
  return raw ? new Set(JSON.parse(raw)) : new Set();
}

async function saveSeenIds(ids: Set<string>) {
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

export function useAlertNotifications(alerts: Alert[] | undefined) {
  const hasRequestedPermission = useRef(false);
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  // Load persisted seen IDs on mount
  useEffect(() => {
    loadSeenIds().then(ids => {
      seenIds.current = ids;
      initialized.current = true;
    });
  }, []);

  // Request permission once
  useEffect(() => {
    if (!Notifications || hasRequestedPermission.current) return;
    hasRequestedPermission.current = true;
    Notifications.requestPermissionsAsync();
  }, []);

  // Fire notifications for new Red alerts
  useEffect(() => {
    if (!alerts || !initialized.current) return;

    const newRedAlerts = alerts.filter(
      a => a.severity === 'Red' && !seenIds.current.has(a.id),
    );

    if (Notifications) {
      for (const alert of newRedAlerts) {
        seenIds.current.add(alert.id);
        Notifications.scheduleNotificationAsync({
          content: {
            title: `🚨 ${alert.title}`,
            body: alert.description,
            data: { url: alert.url },
          },
          trigger: { type: 'timeInterval', seconds: 1, repeats: false },
        });
      }
    }

    // Mark all alerts as seen (not just Red)
    for (const alert of alerts) {
      seenIds.current.add(alert.id);
    }

    saveSeenIds(seenIds.current);
  }, [alerts]);
}
