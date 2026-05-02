import React from "react";
import PropTypes from "prop-types";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useModalEntrance } from "../hooks/useAnimations";
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
  const { scale: scaleAnim, opacity: opacityAnim } = useModalEntrance(visible);

  const cancelButtonStyle = ({ pressed }) => [
    styles.button,
    styles.cancelButton,
    pressed && styles.cancelButtonPressed,
  ];

  const confirmButtonStyle = ({ pressed }) => [
    styles.button,
    isDestructive ? styles.destructiveButton : styles.confirmButton,
    pressed && styles.confirmButtonPressed,
  ];

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
        <Pressable
          accessibilityRole="none"
          onPress={(e) => e.stopPropagation?.()}
          style={styles.dialogShell}
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
                style={cancelButtonStyle}
              >
                <Text style={styles.cancelButtonText}>Voltar</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={onConfirm}
                style={confirmButtonStyle}
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
  dialogShell: {
    width: "100%",
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
