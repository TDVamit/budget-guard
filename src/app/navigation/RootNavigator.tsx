import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useTheme } from '../theme/ThemeProvider';
import { useSettingsStore } from '../../store/settingsStore';
import { OnboardingScreen } from '../../screens/Onboarding/OnboardingScreen';
import { DashboardScreen } from '../../screens/Dashboard/DashboardScreen';
import { AddTransactionScreen } from '../../screens/AddTransaction/AddTransactionScreen';
import { TransactionsScreen } from '../../screens/Transactions/TransactionsScreen';
import { TransactionDetailScreen } from '../../screens/TransactionDetail/TransactionDetailScreen';
import { BudgetSetupScreen } from '../../screens/BudgetSetup/BudgetSetupScreen';
import { IncomeScreen } from '../../screens/Income/IncomeScreen';
import { FixedExpensesScreen } from '../../screens/FixedExpenses/FixedExpensesScreen';
import { PlannedExpensesScreen } from '../../screens/PlannedExpenses/PlannedExpensesScreen';
import { CategoriesScreen } from '../../screens/Categories/CategoriesScreen';
import { AutoDetectionScreen } from '../../screens/AutoDetection/AutoDetectionScreen';
import { SettingsScreen } from '../../screens/Settings/SettingsScreen';
import { BudgetBreakdownScreen } from '../../screens/BudgetBreakdown/BudgetBreakdownScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['budgetguard://'],
  config: {
    screens: {
      Dashboard: 'dashboard',
      AddTransaction: 'add-transaction',
      Transactions: 'transactions',
      TransactionDetail: 'transaction/:transactionId',
      Settings: 'settings',
      AutoDetection: 'review',
      Categories: 'categories',
    },
  },
};

export function RootNavigator() {
  const { colors, dark } = useTheme();
  const onboarded = useSettingsStore((s) => s.onboarded);

  return (
    <NavigationContainer
      linking={linking}
      theme={{
        dark,
        colors: {
          primary: colors.accent,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator
        initialRouteName={onboarded ? 'Dashboard' : 'Onboarding'}
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: 'Add transaction', presentation: 'modal' }} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'History', headerBackVisible: true }} />
        <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: 'Transaction' }} />
        <Stack.Screen name="BudgetSetup" component={BudgetSetupScreen} options={{ title: 'Budget setup' }} />
        <Stack.Screen name="Income" component={IncomeScreen} options={{ title: 'Income sources' }} />
        <Stack.Screen name="FixedExpenses" component={FixedExpensesScreen} options={{ title: 'Fixed expenses' }} />
        <Stack.Screen name="PlannedExpenses" component={PlannedExpensesScreen} options={{ title: 'One-time expenses' }} />
        <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: "This month's budget" }} />
        <Stack.Screen name="AutoDetection" component={AutoDetectionScreen} options={{ title: 'Review' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="BudgetBreakdown" component={BudgetBreakdownScreen} options={{ title: 'Budget breakdown' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
