import React from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../theme/tokens";

export function TopHeroCard({ eyebrow, title, copy, iconName, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={styles.iconShell}>
          <MaterialCommunityIcons
            color={theme.colors.warning}
            name={iconName}
            size={20}
          />
        </View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.copy}>{copy}</Text>
    </View>
  );
}

TopHeroCard.propTypes = {
  copy: PropTypes.string.isRequired,
  eyebrow: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  style: PropTypes.any,
  title: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255, 217, 138, 0.14)",
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    padding: theme.spacing.lg,
    position: "relative",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  iconShell: {
    alignItems: "center",
    backgroundColor: "rgba(4, 11, 23, 0.24)",
    borderColor: "rgba(255, 217, 138, 0.18)",
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  eyebrow: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 8,
  },
  copy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
});
