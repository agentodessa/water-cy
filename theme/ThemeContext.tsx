import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors, darkColors, lightColors } from './colors';

type ThemeContextValue = {
  isDark: boolean;
  colors: AppColors;
  blurIntensity: number;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
  blurIntensity: 60,
  toggleTheme: () => {},
});

const STORAGE_KEY = '@cyprus_water_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark') setOverride(value);
    });
  }, []);

  const isDark = override ? override === 'dark' : systemScheme === 'dark';

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setOverride(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{
      isDark,
      colors: isDark ? darkColors : lightColors,
      blurIntensity: isDark ? 80 : 60,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
