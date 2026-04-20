import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "../theme/tokens";

export function BranchCard({ branch }) {
  return (
    <LinearGradient
      colors={["rgba(7,18,38,0.94)", "rgba(17,35,64,0.96)"]}
      style={styles.card}
    >
      <Text style={styles.name}>{branch.name}</Text>
      <Text style={styles.meta}>
        {branch.city} • {branch.neighborhood}
      </Text>
      <Text style={styles.address}>{branch.addressLine}</Text>
      <Text style={styles.openHours}>{branch.openHours}</Text>
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
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    marginBottom: 6
  },
  meta: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    marginBottom: 8
  },
  address: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    marginBottom: 4
  },
  openHours: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    marginBottom: 14
  },
  depths: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  depthTag: {
    backgroundColor: "rgba(49,231,255,0.1)",
    borderRadius: theme.radius.pill,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8
  }
});
