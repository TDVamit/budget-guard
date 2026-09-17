import { create } from 'zustand';
import { storage } from './mmkv';
import type { ThemeMode } from '../models/types';

const THEME_KEY = 'themeMode';
const ONBOARDED_KEY = 'onboarded';
const NOTIFICATION_SOURCES_KEY = 'enabledNotificationSources';

type SettingsState = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  onboarded: boolean;
  setOnboarded: (value: boolean) => void;

  enabledNotificationSources: string[];
  setEnabledNotificationSources: (packages: string[]) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: (storage.getString(THEME_KEY) as ThemeMode) || 'system',
  setThemeMode: (mode) => {
    storage.set(THEME_KEY, mode);
    set({ themeMode: mode });
  },

  onboarded: storage.getBoolean(ONBOARDED_KEY) ?? false,
  setOnboarded: (value) => {
    storage.set(ONBOARDED_KEY, value);
    set({ onboarded: value });
  },

  enabledNotificationSources: JSON.parse(storage.getString(NOTIFICATION_SOURCES_KEY) || '[]'),
  setEnabledNotificationSources: (packages) => {
    storage.set(NOTIFICATION_SOURCES_KEY, JSON.stringify(packages));
    set({ enabledNotificationSources: packages });
  },
}));
