import React, { useState } from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { ConfirmModal } from "../components/ConfirmModal";
import { useStaggeredEntrance } from "../hooks/useAnimations";
import { cancelReservation, getApiErrorMessage } from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { theme } from "../theme/tokens";

const STATUS_LABELS = {
  confirmed: "Confirmada",
  checked_in: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const STATUS_COLORS = {
  confirmed: theme.colors.warning,
  checked_in: "#4ade80",
  completed: theme.colors.textMuted,
  cancelled: "#f87171",
};

function formatReservationDate(dateTime) {
  return new Date(dateTime).toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        color={theme.colors.warning}
        name={icon}
        size={18}
        style={styles.infoIcon}
      />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

InfoRow.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export function ReservationDetailsScreen({ route, navigation }) {
  const { reservation, onCancelled } = route.params;
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const sectionStyles = useStaggeredEntrance(4, { stagger: 90, fromY: 20 });

  const statusLabel = STATUS_LABELS[reservation.status] ?? reservation.status;
  const statusColor = STATUS_COLORS[reservation.status] ?? theme.colors.textMuted;
  const isCancellable = reservation.status === "confirmed";

  function confirmCancel() {
    setShowCancelModal(true);
  }

  async function handleCancel() {
    setIsCancelling(true);
    try {
      await cancelReservation(reservation.id);
      if (onCancelled) {
        onCancelled(reservation.id);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", getApiErrorMessage(error));
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      <ConfirmModal
        confirmLabel="Cancelar reserva"
        isDestructive
        message={`Deseja cancelar a reserva em ${reservation.branchName}? Esta ação não pode ser desfeita.`}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          handleCancel();
        }}
        title="Cancelar reserva"
        visible={showCancelModal}
      />

      <ScrollView
      bounces={false}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: layout.contentPadding },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>

        {/* Status badge */}
        <Animated.View style={[styles.statusRow, sectionStyles[0]]}>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </Animated.View>

        {/* Branch hero card */}
        <Animated.View style={[styles.heroCard, sectionStyles[1]]}>
          <MaterialCommunityIcons
            color={theme.colors.warning}
            name="calendar-star"
            size={28}
          />
          <Text style={styles.heroTitle}>{reservation.branchName}</Text>
          <Text style={styles.heroDate}>
            {formatReservationDate(reservation.scheduledAt)}
          </Text>
        </Animated.View>

        {/* Detail rows */}
        <Animated.View style={[styles.infoCard, sectionStyles[2]]}>
          <InfoRow
            icon="account-group-outline"
            label="Pessoas"
            value={`${reservation.guests} ${reservation.guests === 1 ? "pessoa" : "pessoas"}`}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="layers-outline"
            label="Ambiente"
            value={reservation.depthLevel}
          />
          {reservation.specialRequest ? (
            <>
              <View style={styles.divider} />
              <InfoRow
                icon="comment-text-outline"
                label="Pedido especial"
                value={reservation.specialRequest}
              />
            </>
          ) : null}
          <View style={styles.divider} />
          <InfoRow
            icon="identifier"
            label="Código da reserva"
            value={reservation.id}
          />
        </Animated.View>

        {/* QR Code */}
        <Animated.View style={[styles.qrSection, sectionStyles[3]]}>
          <Text style={styles.qrLabel}>Apresente na entrada</Text>
          <View style={styles.qrWrapper}>
            <QRCode
              backgroundColor={theme.colors.surfaceRaised}
              color={theme.colors.warning}
              size={180}
              value={reservation.id}
            />
          </View>
          <Text style={styles.qrHint}>
            O QR Code será lido pelo anfitrião no momento do check-in.
          </Text>
        </Animated.View>

        {/* Cancel button */}
        {isCancellable ? (
          <Animated.View style={[styles.cancelSection, sectionStyles[3]]}>
            <Pressable
              accessibilityLabel="Cancelar reserva"
              accessibilityRole="button"
              disabled={isCancelling}
              onPress={confirmCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
                isCancelling && styles.cancelButtonDisabled,
              ]}
            >
              {isCancelling ? (
                <ActivityIndicator color="#f87171" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    color="#f87171"
                    name="calendar-remove-outline"
                    size={18}
                  />
                  <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
                </>
              )}
            </Pressable>
            <Text style={styles.cancelHint}>
              Reservas canceladas não podem ser reativadas.
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </ScrollView>
    </>
  );
}

ReservationDetailsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      onCancelled: PropTypes.func,
      reservation: PropTypes.shape({
        branchName: PropTypes.string.isRequired,
        depthLevel: PropTypes.string.isRequired,
        guests: PropTypes.number.isRequired,
        id: PropTypes.string.isRequired,
        scheduledAt: PropTypes.string.isRequired,
        specialRequest: PropTypes.string,
        status: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  cancelButton: {
    alignItems: "center",
    borderColor: "rgba(248,113,113,0.4)",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonPressed: {
    backgroundColor: "rgba(248,113,113,0.08)",
  },
  cancelButtonText: {
    color: "#f87171",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  cancelHint: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  cancelSection: {
    alignItems: "center",
    marginTop: 8,
    paddingBottom: 32,
  },
  content: {
    alignItems: "center",
    paddingTop: 24,
  },
  divider: {
    backgroundColor: "rgba(255,217,138,0.1)",
    height: 1,
    marginVertical: 4,
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,217,138,0.18)",
    borderWidth: 1,
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    width: "100%",
  },
  heroDate: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    marginTop: 2,
    textAlign: "center",
  },
  heroTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 22,
    letterSpacing: 0.3,
    marginTop: 4,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,217,138,0.12)",
    borderWidth: 1,
    marginBottom: 24,
    paddingVertical: 8,
    width: "100%",
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 1,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    lineHeight: 20,
  },
  qrHint: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
  },
  qrLabel: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.8,
    marginBottom: 20,
    textTransform: "uppercase",
  },
  qrSection: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,217,138,0.18)",
    borderWidth: 1,
    marginBottom: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: "100%",
  },
  qrWrapper: {
    borderColor: "rgba(255,217,138,0.2)",
    borderWidth: 1,
    padding: 16,
  },
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  shell: {
    alignSelf: "center",
    width: "100%",
  },
  statusBadge: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: {
    height: 8,
    width: 8,
  },
  statusRow: {
    alignItems: "center",
    marginBottom: 20,
  },
  statusText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
