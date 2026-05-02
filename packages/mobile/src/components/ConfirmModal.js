import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "../theme/tokens";

export function ConfirmModal({
  confirmLabel,
  isDestructive,
  message,
  onCancel,
  onConfirm,
  title,
  visible,
}) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Fechar diálogo"
        onPress={onCancel}
        style={styles.backdrop}
      >
        <Animated.View
          style={[
            styles.dialog,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Voltar</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                isDestructive ? styles.destructiveButton : styles.confirmButton,
                pressed && styles.confirmButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  isDestructive && styles.destructiveButtonText,
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

ConfirmModal.propTypes = {
  confirmLabel: PropTypes.string.isRequired,
  isDestructive: PropTypes.bool,
  message: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(4, 11, 23, 0.82)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  button: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  cancelButton: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  cancelButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cancelButtonText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: theme.colors.warning,
  },
  confirmButtonPressed: {
    opacity: 0.85,
  },
  confirmButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  destructiveButton: {
    backgroundColor: "rgba(248,113,113,0.12)",
    borderColor: "rgba(248,113,113,0.4)",
    borderWidth: 1,
  },
  destructiveButtonText: {
    color: "#f87171",
  },
  dialog: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,217,138,0.18)",
    borderWidth: 1,
    padding: 24,
    width: "100%",
  },
  message: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 18,
    letterSpacing: 0.2,
  },
});
