export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard: undefined;
  AddTransaction: { transactionId?: string } | undefined;
  Transactions: undefined;
  TransactionDetail: { transactionId: string };
  BudgetSetup: undefined;
  Income: undefined;
  FixedExpenses: undefined;
  PlannedExpenses: undefined;
  Categories: undefined;
  AutoDetection: undefined;
  Settings: undefined;
  BudgetBreakdown: undefined;
};
