import React from "react";
import PropTypes from "prop-types";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, getCategoryLabel, theme } from "../theme/tokens";

export function MenuCard({ item, onAdd, onPress, showAddButton = false, style }) {
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
      <View style={styles.panel}>
        <View style={[styles.topRow, layout.isTiny && styles.topRowStack]}>
          <Text style={styles.category}>{getCategoryLabel(item.category)}</Text>
          <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
        </View>
        <Text
          style={[
            styles.name,
            {
              fontSize: layout.featureTitleSize,
              lineHeight: layout.featureTitleLineHeight
            }
          ]}
        >
          {item.name}
        </Text>
        <Text numberOfLines={3} style={styles.description}>
          {item.description}
        </Text>
        {showAddButton && onAdd ? (
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
        ) : null}
      </View>
    </Pressable>
  );
}

MenuCard.propTypes = {
  item: PropTypes.shape({
    accentColor: PropTypes.string,
    availableForDineIn: PropTypes.bool,
    availableForDelivery: PropTypes.bool,
    category: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    priceCents: PropTypes.number.isRequired
  }).isRequired,
  onAdd: PropTypes.func,
  onPress: PropTypes.func.isRequired,
  showAddButton: PropTypes.bool,
  style: PropTypes.any
};

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
    width: "100%"
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    minHeight: 190,
    minWidth: 0,
    padding: theme.spacing.lg,
    width: "100%"
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 14,
    width: "100%"
  },
  topRowStack: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 6
  },
  category: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 8
  },
  description: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 66
  },
  price: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  addButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 46,
    minWidth: 140,
    paddingHorizontal: 18
  },
  addButtonCompact: {
    alignSelf: "stretch",
    minWidth: 0,
    width: "100%"
  },
  addText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  }
});
