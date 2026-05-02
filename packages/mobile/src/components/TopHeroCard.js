import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Animated, Easing, StyleSheet, Text } from "react-native";

import { theme } from "../theme/tokens";

export function TopHeroCard({ eyebrow, title, copy, iconName, style }) {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.card,
        style,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View style={styles.row}>
        <Animated.View style={styles.iconShell}>
          <MaterialCommunityIcons
            color={theme.colors.warning}
            name={iconName}
            size={20}
          />
        </Animated.View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      </Animated.View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.copy}>{copy}</Text>
    </Animated.View>
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
