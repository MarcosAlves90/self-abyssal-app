import React, { useState } from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  CommonActions,
  DarkTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  CormorantGaramond_600SemiBold
} from "@expo-google-fonts/cormorant-garamond";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold
} from "@expo-google-fonts/space-grotesk";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CartProvider, useCart } from "./src/context/CartContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartFab } from "./src/components/CartFab";
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
  const { checkoutFeedback, clearCheckoutFeedback } = useCart();
  const navigationRef = useNavigationContainerRef();
  const [routeName, setRouteName] = useState(null);
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    CormorantGaramond_600SemiBold
  });

  if (!fontsLoaded || isBootstrapping) {
    return <LoadingOverlay label="Sincronizando experiencia abissal..." />;
  }

  function handleContinueFromCheckoutFeedback() {
    clearCheckoutFeedback();
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "MainTabs",
            params: {
              screen: "Inicio",
            },
          },
        ],
      }),
    );
  }

  return (
    <View style={styles.appShell}>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationTheme}
        onStateChange={() => setRouteName(navigationRef.getCurrentRoute()?.name || null)}
      >
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
      {checkoutFeedback ? (
        <CheckoutFeedbackModal
          feedback={checkoutFeedback}
          onContinue={handleContinueFromCheckoutFeedback}
        />
      ) : null}
      <CartFab currentRouteName={routeName} navigation={navigationRef} />
    </View>
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

const styles = StyleSheet.create({
  appShell: {
    flex: 1
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(2, 6, 15, 0.72)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    maxWidth: 360,
    padding: 24,
    width: "100%",
  },
  modalIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignSelf: "center",
    justifyContent: "center",
    marginBottom: 14,
    minHeight: 56,
    minWidth: 56,
  },
  modalTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
    textAlign: "center",
  },
  modalButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    minHeight: 48,
  },
  modalButtonPressed: {
    opacity: 0.88,
  },
  modalButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
});

function CheckoutFeedbackModal({ feedback, onContinue }) {
  const isSuccess = feedback.tone === "success";
  const accent = isSuccess ? theme.colors.success : theme.colors.danger;

  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconWrap}>
            <MaterialCommunityIcons
              color={accent}
              name={isSuccess ? "check-circle-outline" : "alert-circle-outline"}
              size={30}
            />
          </View>
          <Text style={styles.modalTitle}>
            {feedback.title || (isSuccess ? "Pedido efetuado com sucesso" : "Não foi possível enviar o pedido")}
          </Text>
          <Text style={styles.modalMessage}>{feedback.message}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onContinue}
            style={({ pressed }) => [
              styles.modalButton,
              pressed && styles.modalButtonPressed,
            ]}
          >
            <Text style={styles.modalButtonText}>Continuar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

CheckoutFeedbackModal.propTypes = {
  feedback: PropTypes.shape({
    message: PropTypes.string.isRequired,
    title: PropTypes.string,
    tone: PropTypes.oneOf(["success", "error"]).isRequired,
  }).isRequired,
  onContinue: PropTypes.func.isRequired,
};
