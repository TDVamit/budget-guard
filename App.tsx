/**
 * BudgetGuard
 * @format
 */

import React, { useEffect, useState } from 'react';
import { AppState, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/app/theme/ThemeProvider';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { useBudgetStore } from './src/store/budgetStore';
import { onTransactionDetected } from './src/native/localNotification';
import { SplashAnimation } from './src/components/SplashAnimation';

function AppShell() {
  const { dark } = useTheme();
  const loading = useBudgetStore((s) => s.loading);
  const bootstrap = useBudgetStore((s) => s.bootstrap);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // The notification listener writes transactions straight to SQLite with no JS
  // involved: reload when the app comes back, and when it tells us a payment
  // landed while we were already open.
  useEffect(() => {
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') useBudgetStore.getState().refresh();
    });
    const detected = onTransactionDetected(() => useBudgetStore.getState().refresh());
    return () => {
      appState.remove();
      detected.remove();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      {loading || !splashDone ? <SplashAnimation onFinish={() => setSplashDone(true)} /> : <RootNavigator />}
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
