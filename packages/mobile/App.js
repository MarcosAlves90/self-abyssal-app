import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  CormorantGaramond_600SemiBold
} from "@expo-google-fonts/cormorant-garamond";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold
} from "@expo-google-fonts/space-grotesk";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CartProvider } from "./src/context/CartContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { LoadingOverlay } from "./src/components/LoadingOverlay";
import { theme } from "./src/theme/tokens";

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    border: theme.colors.border,
    text: theme.colors.text,
    primary: theme.colors.accent
  }
};

function AppShell() {
  const { isBootstrapping } = useAuth();
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    CormorantGaramond_600SemiBold
  });

  if (!fontsLoaded || isBootstrapping) {
    return <LoadingOverlay label="Sincronizando experiencia abissal..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
