import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../app/theme/ThemeProvider';
import { spacing } from '../app/theme/theme';
import { AmbientBackground } from './AmbientBackground';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AmbientBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
