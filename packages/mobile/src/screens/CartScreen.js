import React from "react";
import PropTypes from "prop-types";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
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
          <Text numberOfLines={1} style={styles.itemName}>
            {item.name}
          </Text>
          <Text style={styles.itemPrice}>{formatCurrency(item.priceCents)}</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={onRemove} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>Remover</Text>
        </Pressable>
      </View>

      <View style={styles.quantityRow}>
        <Pressable accessibilityRole="button" onPress={onDecrease} style={styles.quantityButton}>
          <Text style={styles.quantityButtonText}>-</Text>
        </Pressable>
        <Text style={styles.quantityValue}>{item.quantity}</Text>
        <Pressable accessibilityRole="button" onPress={onIncrease} style={styles.quantityButton}>
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
    quantity: PropTypes.number.isRequired
  }).isRequired,
  onDecrease: PropTypes.func.isRequired,
  onIncrease: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};

export function CartScreen({ navigation }) {
  const { clearCart, itemCount, items, removeItem, totalCents, updateItemQuantity } = useCart();
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { padding: layout.contentPadding }]}
      style={styles.screen}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}> 
        <LinearGradient
          colors={[
            "rgba(8, 23, 44, 0.98)",
            "rgba(12, 34, 60, 0.98)",
            "rgba(19, 52, 91, 0.98)"
          ]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.hero}
        >
          <Text style={styles.heroEyebrow}>Carrinho</Text>
          <Text
            style={[
              styles.heroTitle,
              {
                fontSize: layout.heroTitleSize,
                lineHeight: layout.heroTitleLineHeight
              }
            ]}
          >
            {itemCount ? "Seu pedido está quase pronto." : "Seu carrinho está vazio."}
          </Text>
          <Text style={styles.heroSubtitle}>
            {itemCount
              ? `${itemCount} itens selecionados somando ${formatCurrency(totalCents)}.`
              : "Adicione pratos no menu para montar o pedido em uma tela limpa."}
          </Text>
        </LinearGradient>

        {itemCount ? (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryLabel}>Itens</Text>
                <Text style={styles.summaryValue}>{itemCount}</Text>
              </View>
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalCents)}</Text>
              </View>
            </View>

            <View style={styles.list}>{items.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                onDecrease={() => updateItemQuantity(item.id, item.quantity - 1)}
                onIncrease={() => updateItemQuantity(item.id, item.quantity + 1)}
                onRemove={() => removeItem(item.id)}
              />
            ))}</View>

            <View style={styles.actionCard}>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate("Reserva")}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Continuar para reserva</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate("Menu")}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Adicionar mais itens</Text>
              </Pressable>

              <Pressable accessibilityRole="button" onPress={clearCart} style={styles.textButton}>
                <Text style={styles.textButtonText}>Limpar carrinho</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Ainda não há nada aqui.</Text>
            <Text style={styles.emptyCopy}>
              Abra o menu, selecione pratos e volte para finalizar com mais calma.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("Menu")}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Ir para o menu</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

CartScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired
  }).isRequired
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  content: {
    alignItems: "center",
    paddingBottom: 120
  },
  shell: {
    width: "100%"
  },
  hero: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl
  },
  heroEyebrow: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  heroTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginTop: 8,
    maxWidth: 640
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10,
    maxWidth: 640
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg
  },
  summaryBlock: {
    gap: 4
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  summaryValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 28
  },
  list: {
    gap: 12,
    marginBottom: theme.spacing.lg
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  itemTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 12
  },
  itemCopy: {
    flex: 1,
    gap: 2
  },
  itemName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  itemPrice: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  removeButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12
  },
  removeButtonText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12
  },
  quantityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  quantityButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    height: 34,
    justifyContent: "center",
    width: 34
  },
  quantityButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18
  },
  quantityValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    minWidth: 18,
    textAlign: "center"
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    gap: 10,
    padding: theme.spacing.lg
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  textButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36
  },
  textButtonText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.xl
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    marginBottom: 8
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: theme.spacing.lg
  }
});