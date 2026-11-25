import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AppProvider, useApp } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import { Txt, Button } from './src/components/UI';

function AppContent() {
  const { isDark, theme } = useTheme();
  const { loading, error, reload } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg1 }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: theme.bg1 }}>
        <Txt size={20} weight="800" style={{ textAlign: 'center' }}>No se pudo iniciar MiBolsillo</Txt>
        <Txt size={13} color={theme.muted} style={{ textAlign: 'center', marginVertical: 14 }}>{error}</Txt>
        <Button title="Reintentar" icon="refresh" onPress={reload} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
