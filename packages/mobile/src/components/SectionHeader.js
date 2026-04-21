import React from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { getResponsiveLayout } from "../theme/layout";
import { theme } from "../theme/tokens";

export function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  onActionPress
}) {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <View style={[styles.row, layout.isCompact && styles.rowCompact]}>
      <View style={[styles.copy, layout.isCompact && styles.copyCompact]}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text
          style={[
            styles.title,
            {
              fontSize: layout.sectionTitleSize,
              lineHeight: layout.sectionTitleLineHeight
            }
          ]}
        >
          {title}
        </Text>
        {description ? (
          <Text style={[styles.description, layout.isCompact && styles.descriptionCompact]}>
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onActionPress}
          style={[styles.actionButton, layout.isCompact && styles.actionButtonCompact]}
        >
          <Text style={[styles.actionText, layout.isCompact && styles.actionTextCompact]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-end",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: theme.spacing.md
  },
  rowCompact: {
    alignItems: "stretch"
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 220
  },
  copyCompact: {
    minWidth: 0,
    width: "100%"
  },
  eyebrow: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display
  },
  description: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 2
  },
  descriptionCompact: {
    lineHeight: 20
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16
  },
  actionButtonCompact: {
    width: "100%"
  },
  actionText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  actionTextCompact: {
    textAlign: "center"
  }
});
