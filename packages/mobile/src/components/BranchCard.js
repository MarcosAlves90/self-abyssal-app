import React from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { getResponsiveLayout } from "../theme/layout";
import { theme } from "../theme/tokens";

export function BranchCard({ branch, compact = false, style }) {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <LinearGradient
      colors={["rgba(7,18,38,0.98)", "rgba(17,35,64,0.98)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, compact && styles.cardCompact, style]}
    >
      <View style={[styles.topRow, layout.isCompact && styles.topRowStack]}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Experiencia presencial</Text>
          <Text
            style={[
              styles.name,
              compact && styles.nameCompact,
              {
                fontSize: layout.isTiny ? 24 : layout.isCompact ? 28 : compact ? 30 : 34,
                lineHeight: layout.isTiny ? 30 : layout.isCompact ? 32 : compact ? 34 : 38
              }
            ]}
          >
            {branch.name}
          </Text>
          <Text style={styles.meta}>
            {branch.city} • {branch.neighborhood}
          </Text>
        </View>
        <View style={[styles.hoursBadge, layout.isCompact && styles.hoursBadgeCompact]}>
          <Text style={styles.hoursBadgeText}>{branch.openHours}</Text>
        </View>
      </View>
      <Text style={styles.address}>{branch.addressLine}</Text>
      <Text style={styles.sectionLabel}>Profundidades disponiveis</Text>
      <View style={styles.depths}>
        {branch.reservationDepths.map((depth) => (
          <Text key={depth} style={styles.depthTag}>
            {depth}
          </Text>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    minHeight: 228,
    padding: theme.spacing.lg
  },
  cardCompact: {
    minHeight: 210
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 12
  },
  topRowStack: {
    flexDirection: "column"
  },
  copy: {
    flex: 1
  },
  eyebrow: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: "uppercase"
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    marginBottom: 6
  },
  nameCompact: {
    fontSize: 30,
    lineHeight: 34
  },
  meta: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18
  },
  hoursBadge: {
    backgroundColor: "rgba(49,231,255,0.12)",
    borderColor: "rgba(49,231,255,0.18)",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  hoursBadgeCompact: {
    alignSelf: "flex-start"
  },
  hoursBadgeText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12
  },
  address: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16
  },
  sectionLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    marginBottom: 14,
    textTransform: "uppercase"
  },
  depths: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  depthTag: {
    backgroundColor: "rgba(49,231,255,0.1)",
    borderColor: "rgba(49,231,255,0.1)",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8
  }
});
