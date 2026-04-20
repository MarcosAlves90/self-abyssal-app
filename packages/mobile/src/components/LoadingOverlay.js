import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "../theme/tokens";

export function LoadingOverlay({ label = "Carregando..." }) {
  return (
    <LinearGradient
      colors={["#02060f", "#071226", "#0b1f39"]}
      style={styles.container}
    >
      <View style={styles.core}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
        <Text style={styles.label}>{label}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  core: {
    alignItems: "center",
    gap: 14
  },
  label: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15
  }
});
