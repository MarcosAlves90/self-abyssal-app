import React from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatCurrency, theme } from "../theme/tokens";

const STATUS_META = {
  pending:    { label: "Aguardando confirmação", icon: "clock-outline",          color: theme.colors.textMuted },
  preparing:  { label: "Em preparo",              icon: "chef-hat",               color: theme.colors.warning },
  on_the_way: { label: "A caminho",               icon: "moped",                  color: theme.colors.accent },
  served:     { label: "Entregue ao porteiro",    icon: "package-variant-closed", color: theme.colors.success },
  completed:  { label: "Concluído",               icon: "check-decagram",         color: theme.colors.success },
  cancelled:  { label: "Cancelado",               icon: "close-circle-outline",   color: theme.colors.danger },
};

function getStatusMeta(status) {
  return STATUS_META[status] ?? {
    label: status,
    icon: "help-circle-outline",
    color: theme.colors.textMuted,
  };
}

export function ActiveOrderCard({ order, onPress }) {
  const meta = getStatusMeta(order.status);

  return (
    <Pressable
      accessibilityLabel={`Ver pedido ${order.id}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: meta.color }]} />

      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.eyebrowRow}>
            <MaterialCommunityIcons
              color={theme.colors.warning}
              name="moped-electric-outline"
              size={14}
            />
            <Text style={styles.eyebrow}>Pedido em andamento</Text>
          </View>
          <MaterialCommunityIcons
            color={theme.colors.textMuted}
            name="chevron-right"
            size={18}
          />
        </View>

        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
          <MaterialCommunityIcons color={meta.color} name={meta.icon} size={16} />
          <Text style={[styles.statusLabel, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.orderId} numberOfLines={1}>
            #{order.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.total}>{formatCurrency(order.totalCents)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

ActiveOrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    totalCents: PropTypes.number.isRequired,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,217,138,0.2)",
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
  cardPressed: {
    backgroundColor: "rgba(255,217,138,0.06)",
  },
  accentBar: {
    width: 3,
  },
  body: {
    flex: 1,
    gap: 8,
    padding: theme.spacing.md,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrowRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  eyebrow: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  statusDot: {
    borderRadius: 99,
    height: 6,
    width: 6,
  },
  statusLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderId: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  total: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
  },
});
