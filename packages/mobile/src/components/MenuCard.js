import React from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, getCategoryLabel, theme } from "../theme/tokens";

export function MenuCard({ item, onAdd, onPress, compact = false, style }) {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <Pressable
      accessibilityHint="Abre os detalhes do prato"
      accessibilityLabel={`${item.name}, ${formatCurrency(item.priceCents)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, style]}
    >
      <LinearGradient
        colors={["rgba(49,231,255,0.14)", "rgba(13,26,47,0.98)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.panel,
          layout.isCompact && styles.panelCompact,
          { borderColor: item.accentColor || theme.colors.border }
        ]}
      >
        <View style={[styles.topRow, layout.isCompact && styles.topRowStack]}>
          <Text style={styles.category}>{getCategoryLabel(item.category)}</Text>
          <View style={[styles.availabilityRow, layout.isCompact && styles.availabilityRowCompact]}>
            {item.availableForDineIn ? <Text style={styles.availabilityTag}>Salao</Text> : null}
            {item.availableForDelivery ? (
              <Text style={styles.availabilityTag}>Delivery</Text>
            ) : null}
          </View>
        </View>
        <Text
          style={[
            styles.name,
            compact && styles.nameCompact,
            {
              fontSize: layout.isTiny ? 24 : layout.isCompact ? 27 : compact ? 26 : 30,
              lineHeight: layout.isTiny ? 30 : layout.isCompact ? 31 : compact ? 30 : 34
            }
          ]}
        >
          {item.name}
        </Text>
        <Text numberOfLines={layout.isCompact || compact ? 2 : 3} style={styles.description}>
          {item.description}
        </Text>
        <View style={[styles.footer, layout.isCompact && styles.footerStack]}>
          <View>
            <Text style={styles.priceLabel}>A partir de</Text>
            <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
          </View>
          <Pressable
            accessibilityLabel={`Adicionar ${item.name} ao carrinho`}
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              onAdd();
            }}
            style={[styles.addButton, layout.isCompact && styles.addButtonCompact]}
          >
            <Text style={styles.addText}>Adicionar</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 0
  },
  panel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    minHeight: 244,
    padding: theme.spacing.lg
  },
  panelCompact: {
    minHeight: 0,
    padding: theme.spacing.md
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm
  },
  topRowStack: {
    flexDirection: "column",
    gap: 10
  },
  category: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  availabilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
    marginLeft: 12
  },
  availabilityRowCompact: {
    justifyContent: "flex-start",
    marginLeft: 0
  },
  availabilityTag: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: theme.radius.pill,
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 8
  },
  nameCompact: {
    fontSize: 26,
    lineHeight: 30
  },
  description: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 66
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18
  },
  footerStack: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 12
  },
  priceLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginBottom: 4
  },
  price: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 20
  },
  addButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 122,
    paddingHorizontal: 18
  },
  addButtonCompact: {
    minWidth: 0,
    width: "100%"
  },
  addText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  }
});
