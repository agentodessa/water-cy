import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { AlertType } from './useAlerts';

const STORAGE_KEY = 'alert-preferences';

const ALL_TYPES: AlertType[] = ['earthquake', 'flood', 'cyclone', 'volcano', 'drought'];

export function useAlertPreferences() {
  const [enabledTypes, setEnabledTypes] = useState<Set<AlertType>>(new Set(ALL_TYPES));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        const arr = JSON.parse(raw) as AlertType[];
        setEnabledTypes(new Set(arr));
      }
    });
  }, []);

  const toggleType = useCallback((type: AlertType) => {
    setEnabledTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isEnabled = useCallback(
    (type: AlertType) => enabledTypes.has(type),
    [enabledTypes],
  );

  return { enabledTypes, toggleType, isEnabled };
}
