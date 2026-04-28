import React from "react";
import PropTypes from "prop-types";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { SeaShellIcon } from "./icons/SeaShellIcon";
import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, getCategoryLabel, theme } from "../theme/tokens";

const menuItemShape = {
  accentColor: PropTypes.string,
  availableForDineIn: PropTypes.bool,
  availableForDelivery: PropTypes.bool,
  category: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  imageHint: PropTypes.string,
  imageUrl: PropTypes.string,
  isFeatured: PropTypes.bool,
  name: PropTypes.string.isRequired,
  priceCents: PropTypes.number.isRequired
};

function getMediaMetrics(layout) {
  if (layout.isTiny) {
    return {
      mediaHeight: 164,
      shellSize: 66
    };
  }

  if (layout.isCompact) {
    return {
      mediaHeight: 176,
      shellSize: 74
    };
  }

  return {
    mediaHeight: 188,
    shellSize: 84
  };
}

function MenuCardMedia({ item, mediaHeight, shellSize }) {
  return (
    <View style={[styles.media, { minHeight: mediaHeight }]}>
      <View style={styles.mediaFallback}>
        <SeaShellIcon color={theme.colors.text} size={shellSize} />
      </View>

      {item.imageUrl ? (
        <Image resizeMode="cover" source={{ uri: item.imageUrl }} style={styles.mediaImage} />
      ) : null}

      <LinearGradient
        colors={["rgba(255, 217, 138, 0.04)", "rgba(4, 11, 23, 0.46)", "rgba(4, 11, 23, 0.92)"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.mediaTopRow}>
        <View style={styles.badgeStack}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{getCategoryLabel(item.category)}</Text>
          </View>
        </View>
        {item.isFeatured ? (
          <Text accessibilityLabel="Prato em destaque" style={styles.featuredStarText}>
            ★
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function MenuCardFooter({ item, layout, onAdd, shouldStackFooter, showAddButton }) {
  return (
    <View style={[styles.footer, shouldStackFooter && styles.footerStack]}>
      <View style={styles.priceBlock}>
        <Text style={styles.priceLabel}>Investimento</Text>
        <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
      </View>

      {showAddButton && onAdd ? (
        <Pressable
          accessibilityLabel={`Selecionar ${item.name}`}
          accessibilityRole="button"
          onPress={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          style={[styles.addButton, layout.isCompact && styles.addButtonCompact]}
        >
          <Text style={styles.addText}>Adicionar à seleção</Text>
        </Pressable>
      ) : (
        <Text style={styles.footerHint}>Toque para abrir o prato.</Text>
      )}
    </View>
  );
}

MenuCardMedia.propTypes = {
  item: PropTypes.shape(menuItemShape).isRequired,
  mediaHeight: PropTypes.number.isRequired,
  shellSize: PropTypes.number.isRequired
};

MenuCardFooter.propTypes = {
  item: PropTypes.shape(menuItemShape).isRequired,
  layout: PropTypes.shape({
    isCompact: PropTypes.bool.isRequired,
    isTiny: PropTypes.bool
  }).isRequired,
  onAdd: PropTypes.func,
  shouldStackFooter: PropTypes.bool.isRequired,
  showAddButton: PropTypes.bool.isRequired
};

export function MenuCard({ item, onAdd, onPress, showAddButton = false, style }) {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const { mediaHeight, shellSize } = getMediaMetrics(layout);
  const shouldStackFooter = showAddButton && layout.isCompact;

  return (
    <Pressable
      accessibilityHint="Abre os detalhes do prato"
      accessibilityLabel={`${item.name}, ${getCategoryLabel(item.category)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, style]}
    >
      <LinearGradient
        colors={["rgba(17, 35, 64, 0.98)", "rgba(11, 20, 35, 0.99)", "rgba(4, 11, 23, 1)"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.panel}
      >
        <MenuCardMedia
          item={item}
          mediaHeight={mediaHeight}
          shellSize={shellSize}
        />

        <View style={styles.body}>
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
          <Text numberOfLines={layout.isTiny ? 3 : 2} style={styles.description}>
            {item.description}
          </Text>

          <MenuCardFooter
            item={item}
            layout={layout}
            onAdd={onAdd}
            shouldStackFooter={shouldStackFooter}
            showAddButton={showAddButton}
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

MenuCard.propTypes = {
  item: PropTypes.shape(menuItemShape).isRequired,
  onAdd: PropTypes.func,
  onPress: PropTypes.func.isRequired,
  showAddButton: PropTypes.bool,
  style: PropTypes.any
};

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 16
    },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
    width: "100%"
  },
  panel: {
    borderColor: "rgba(255, 217, 138, 0.12)",
    borderWidth: 1,
    overflow: "hidden",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface
  },
  media: {
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    position: "relative",
    borderColor: "rgba(255, 217, 138, 0.1)",
    borderWidth: 1,
    minHeight: 180
  },
  mediaImage: {
    ...StyleSheet.absoluteFillObject
  },
  mediaFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  mediaTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    position: "relative",
    zIndex: 2
  },
  badgeStack: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "82%"
  },
  categoryBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(4, 11, 23, 0.28)",
    borderColor: "rgba(255, 217, 138, 0.16)",
    borderWidth: 1,
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  categoryBadgeText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  featuredStarText: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 30,
    includeFontPadding: false,
    lineHeight: 24,
    textShadowColor: "rgba(255, 217, 138, 0.42)",
    textShadowOffset: {
      width: 0,
      height: 0
    },
    textShadowRadius: 12,
    textAlignVertical: "center",
    transform: [{ translateY: -3 }]
  },
  body: {
    gap: 14
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display
  },
  description: {
    color: "rgba(214, 232, 240, 0.9)",
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 48
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 6
  },
  footerStack: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  priceBlock: {
    flexShrink: 1
  },
  priceLabel: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 2,
    textTransform: "uppercase"
  },
  price: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  footerHint: {
    color: theme.colors.textMuted,
    flexShrink: 1,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    textAlign: "right"
  },
  addButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "rgba(255, 217, 138, 0.12)",
    borderColor: "rgba(255, 217, 138, 0.24)",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 148,
    paddingHorizontal: 18
  },
  addButtonCompact: {
    alignSelf: "stretch",
    minWidth: 0,
    width: "100%"
  },
  addText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  }
});
