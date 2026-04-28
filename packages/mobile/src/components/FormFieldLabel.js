import React from "react";
import PropTypes from "prop-types";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../theme/tokens";

export function FormFieldLabel({ label, required, style }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      {required ? <Text style={styles.requiredMark}>*</Text> : null}
    </View>
  );
}

FormFieldLabel.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  style: PropTypes.any,
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  label: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  requiredMark: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    lineHeight: 16,
  },
});
