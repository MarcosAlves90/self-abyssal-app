import React from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useCart } from "../context/CartContext";
import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, theme } from "../theme/tokens";

function CartRow({ item, onRemove, onDecrease, onIncrease }) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemTopRow}>
        <View style={styles.itemCopy}>
          <View style={styles.itemHeaderRow}>
            <MaterialCommunityIcons
              color={theme.colors.warning}
              name="silverware-fork-knife"
              size={16}
            />
            <Text numberOfLines={1} style={styles.itemName}>
              {item.name}
            </Text>
          </View>
          <Text style={styles.itemPrice}>{formatCurrency(item.priceCents)}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onRemove}
          style={styles.removeButton}
        >
          <Text style={styles.removeButtonText}>Retirar</Text>
        </Pressable>
      </View>

      <View style={styles.quantityRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onDecrease}
          style={styles.quantityButton}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </Pressable>
        <Text style={styles.quantityValue}>{item.quantity}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onIncrease}
          style={styles.quantityButton}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

CartRow.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    priceCents: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
  }).isRequired,
  onDecrease: PropTypes.func.isRequired,
  onIncrease: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export function CartScreen({ navigation }) {
  const {
    clearCart,
    itemCount,
    items,
    removeItem,
    totalCents,
    updateItemQuantity,
  } = useCart();
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: layout.contentPadding,
          paddingTop: layout.contentPadding,
        },
      ]}
      style={styles.screen}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[
              "rgba(255,217,138,0.18)",
              "rgba(17,35,64,0.96)",
              "rgba(7,18,38,1)",
            ]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroGlow} />
          <View style={styles.heroRow}>
            <View style={styles.heroIconShell}>
              <MaterialCommunityIcons
                color={theme.colors.warning}
                name="silverware-fork-knife"
                size={20}
              />
            </View>
            <Text style={styles.heroEyebrow}>Seleção da mesa</Text>
          </View>
          <Text style={styles.heroTitle}>Revisão dos pratos escolhidos</Text>
          <Text style={styles.heroCopy}>
            Ajuste quantidades, retire itens ou siga para a finalização sem
            perder o ritmo da experiência.
          </Text>
        </View>

        {itemCount ? (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryLabel}>Pratos</Text>
                <Text style={styles.summaryValue}>{itemCount}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryLabel}>Total da mesa</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totalCents)}
                </Text>
              </View>
            </View>

            <View style={styles.list}>
              {items.map((item) => (
                <CartRow
                  key={item.id}
                  item={item}
                  onDecrease={() =>
                    updateItemQuantity(item.id, item.quantity - 1)
                  }
                  onIncrease={() =>
                    updateItemQuantity(item.id, item.quantity + 1)
                  }
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </View>

            <View style={styles.actionCard}>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate("DeliveryCheckout")}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  Seguir para a finalização
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate("Menu")}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  Voltar ao cardápio
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={clearCart}
                style={styles.textButton}
              >
                <Text style={styles.textButtonText}>Limpar seleção</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sua mesa está vazia.</Text>
            <Text style={styles.emptyCopy}>
              Escolha pratos do cardápio para compor a experiência antes de
              finalizar.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("Menu")}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Ir ao cardápio</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

CartScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    alignItems: "center",
    paddingBottom: theme.overlays.scrollBottomSafeArea,
  },
  shell: {
    width: "100%",
  },
  heroCard: {
    borderColor: "rgba(255,217,138,0.18)",
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    padding: theme.spacing.lg,
    position: "relative",
  },
  heroGlow: {
    backgroundColor: "rgba(255,217,138,0.18)",
    height: 180,
    opacity: 0.24,
    position: "absolute",
    right: -36,
    top: -36,
    width: 180,
  },
  heroRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    position: "relative",
    zIndex: 1,
  },
  heroIconShell: {
    alignItems: "center",
    backgroundColor: "rgba(4, 11, 23, 0.24)",
    borderColor: "rgba(255,217,138,0.18)",
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  heroEyebrow: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 8,
    position: "relative",
    zIndex: 1,
  },
  heroCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    position: "relative",
    zIndex: 1,
  },
  summaryCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  summaryBlock: {
    gap: 4,
  },
  summaryDivider: {
    backgroundColor: theme.colors.border,
    alignSelf: "stretch",
    width: 1,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 28,
  },
  list: {
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  itemTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  itemCopy: {
    flex: 1,
    gap: 2,
  },
  itemHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  itemName: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
  },
  itemPrice: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
  removeButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,217,138,0.08)",
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
  },
  quantityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,217,138,0.12)",
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  quantityButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
  },
  quantityValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    minWidth: 18,
    textAlign: "center",
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    gap: 10,
    padding: theme.spacing.lg,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.warning,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  textButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  textButtonText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    marginBottom: 8,
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
});
