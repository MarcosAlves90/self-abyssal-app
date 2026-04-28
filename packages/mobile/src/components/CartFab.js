import React from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { theme } from "../theme/tokens";

const TAB_BAR_HEIGHT = 82;
const TAB_BAR_OVERLAP = 2;

export function CartFab({ currentRouteName, navigation }) {
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const hiddenRoutes = new Set(["Cart", "DeliveryCheckout", "DishDetails"]);

  if (!isAuthenticated || !itemCount || hiddenRoutes.has(currentRouteName)) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { bottom: insets.bottom + TAB_BAR_HEIGHT - TAB_BAR_OVERLAP },
      ]}
    >
      <Pressable
        accessibilityLabel={`Abrir carrinho com ${itemCount} itens`}
        accessibilityRole="button"
        onPress={() => navigation.navigate("Cart")}
        style={styles.button}
      >
        <BlurView
          intensity={32}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.accentOverlay} />
        <View style={styles.backdrop} />

        <View style={styles.contentRow}>
          <View style={styles.iconShell}>
            <MaterialCommunityIcons
              color="#FFFFFF"
              name="cart-outline"
              size={22}
            />
          </View>
          <View style={styles.copy}>
            <Text style={styles.label}>Carrinho</Text>
            <Text style={styles.hint}>Toque para revisar</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

CartFab.propTypes = {
  currentRouteName: PropTypes.string,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 50,
  },
  button: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 66,
    width: "100%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },
  backdrop: {
    backgroundColor: "rgba(4, 11, 23, 0.08)",
    ...StyleSheet.absoluteFillObject,
  },
  accentOverlay: {
    backgroundColor: "rgba(141, 249, 255, 0.28)",
    ...StyleSheet.absoluteFillObject,
  },
  contentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "relative",
    width: "100%",
    zIndex: 1,
  },
  iconShell: {
    alignItems: "center",
    backgroundColor: "rgba(4, 11, 23, 0.24)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  copy: {
    flex: 1,
  },
  label: {
    color: "#FFFFFF",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  hint: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.82)",
    justifyContent: "center",
    minHeight: 28,
    minWidth: 28,
  },
  badgeText: {
    color: "#000000",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    lineHeight: 12,
  },
});
