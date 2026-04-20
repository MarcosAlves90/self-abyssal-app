import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { formatCurrency, getCategoryLabel, theme } from "../theme/tokens";

export function MenuCard({ item, onAdd, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <LinearGradient
        colors={["rgba(49,231,255,0.12)", "rgba(13,26,47,0.96)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.panel, { borderColor: item.accentColor || theme.colors.border }]}
      >
        <View style={styles.topRow}>
          <Text style={styles.category}>{getCategoryLabel(item.category)}</Text>
          <View style={[styles.dot, { backgroundColor: item.accentColor || theme.colors.accent }]} />
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text numberOfLines={3} style={styles.description}>
          {item.description}
        </Text>
        <View style={styles.badges}>
          {item.availableForDineIn ? <Text style={styles.badge}>Salao</Text> : null}
          {item.availableForDelivery ? <Text style={styles.badge}>Delivery</Text> : null}
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatCurrency(item.priceCents)}</Text>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onAdd();
            }}
            style={styles.addButton}
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
    marginBottom: theme.spacing.md
  },
  panel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm
  },
  category: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  dot: {
    borderRadius: theme.radius.pill,
    height: 12,
    width: 12
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    marginBottom: 8
  },
  description: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 66
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14
  },
  badge: {
    backgroundColor: "rgba(122,225,255,0.1)",
    borderRadius: theme.radius.pill,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18
  },
  price: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 20
  },
  addButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18
  },
  addText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  }
});
