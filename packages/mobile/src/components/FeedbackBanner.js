import React from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "../theme/tokens";

export function FeedbackBanner({ tone, message }) {
  if (tone === "idle" || !message) {
    return null;
  }

  const resolvedTone = {
    success: {
      container: styles.success,
      icon: theme.colors.success,
    },
    error: {
      container: styles.error,
      icon: theme.colors.danger,
    },
    saving: {
      container: styles.saving,
      icon: theme.colors.accentSoft,
    },
  }[tone] || {
    container: styles.error,
    icon: theme.colors.danger,
  };

  return (
    <View style={[styles.container, resolvedTone.container]}>
      {tone === "saving" ? (
        <ActivityIndicator color={resolvedTone.icon} size="small" />
      ) : (
        <MaterialCommunityIcons
          color={resolvedTone.icon}
          name={tone === "success" ? "check-decagram-outline" : "alert-circle-outline"}
          size={18}
        />
      )}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

FeedbackBanner.propTypes = {
  message: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(["idle", "saving", "success", "error"]).isRequired,
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: theme.spacing.md,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  success: {
    backgroundColor: "rgba(114, 240, 184, 0.08)",
    borderColor: theme.colors.success,
  },
  error: {
    backgroundColor: "rgba(255, 139, 156, 0.08)",
    borderColor: theme.colors.danger,
  },
  saving: {
    backgroundColor: "rgba(141, 249, 255, 0.08)",
    borderColor: theme.colors.accentSoft,
  },
  message: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
});
