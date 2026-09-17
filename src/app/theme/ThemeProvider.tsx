import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './theme';
import { useSettingsStore } from '../../store/settingsStore';

const ThemeContext = createContext<{ colors: ThemeColors; dark: boolean }>({
  colors: lightColors,
  dark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);

  const dark = themeMode === 'system' ? system === 'dark' : themeMode === 'dark';
  const value = useMemo(() => ({ colors: dark ? darkColors : lightColors, dark }), [dark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
