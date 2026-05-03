import React, { useState } from "react";
import PropTypes from "prop-types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ConfirmModal } from "../components/ConfirmModal";
import { getResponsiveLayout } from "../theme/layout";
import { cancelOrder, getApiErrorMessage, isAbortedRequest } from "../services/api";
import { formatCurrency, theme } from "../theme/tokens";
import { useRequestManager } from "../utils/requestManager";

const ORDER_STEPS = [
  { key: "pending", label: "Recebido", icon: "clock-outline" },
  { key: "preparing", label: "Em preparo", icon: "chef-hat" },
  { key: "on_the_way", label: "A caminho", icon: "moped" },
  { key: "served", label: "Entregue", icon: "package-variant-closed" },
  { key: "completed", label: "Concluído", icon: "check-decagram" },
];

const STATUS_COLORS = {
  pending: theme.colors.textMuted,
  preparing: theme.colors.warning,
  on_the_way: theme.colors.accent,
  served: theme.colors.success,
  completed: theme.colors.success,
  cancelled: theme.colors.danger,
};

const STATUS_DESCRIPTIONS = {
  pending: "Seu pedido foi recebido e aguarda confirmação da cozinha.",
  preparing: "Seu pedido está sendo preparado com cuidado.",
  on_the_way: "Seu pedido está a caminho do seu endereço.",
  served: "Pedido entregue! Confirme o recebimento com o entregador.",
  completed: "Pedido finalizado. Bom apetite!",
  cancelled: "Este pedido foi cancelado.",
};

function getStepIndex(status) {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

function StepTracker({ status }) {
  const activeIndex = getStepIndex(status);
  const activeColor = STATUS_COLORS[status] ?? theme.colors.textMuted;

  return (
    <View style={styles.stepTracker}>
      {ORDER_STEPS.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;
        const dotColor = isDone || isActive ? activeColor : theme.colors.border;
        let labelColor = "rgba(150,183,201,0.4)";

        if (isDone) {
          labelColor = theme.colors.textMuted;
        } else if (isActive) {
          labelColor = activeColor;
        }

        return (
          <View key={step.key} style={styles.stepItem}>
            {index > 0 && (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: index <= activeIndex ? activeColor : theme.colors.border },
                ]}
              />
            )}
            <View style={[styles.stepDot, { borderColor: dotColor, backgroundColor: isDone || isActive ? dotColor : "transparent" }]}>
              <MaterialCommunityIcons
                color={isDone || isActive ? theme.colors.background : dotColor}
                name={step.icon}
                size={12}
              />
            </View>
            <Text style={[styles.stepLabel, { color: labelColor }]} numberOfLines={1}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

StepTracker.propTypes = {
  status: PropTypes.string.isRequired,
};

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        color={theme.colors.warning}
        name={icon}
        size={16}
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

export function OrderTrackingScreen({ route, navigation }) {
  const { order } = route.params;
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const requestManager = useRequestManager();

  const activeColor = STATUS_COLORS[order.status] ?? theme.colors.textMuted;
  const description = STATUS_DESCRIPTIONS[order.status] ?? "Acompanhe o andamento do seu pedido abaixo.";
  const createdDate = new Date(order.createdAt).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const isCancellable = !["completed", "cancelled"].includes(order.status);

  function confirmCancel() {
    setShowCancelModal(true);
  }

  async function handleCancel() {
    const controller = requestManager.start("order.cancel");
    setIsCancelling(true);
    try {
      await cancelOrder(order.id, { signal: controller.signal });
      if (controller.signal.aborted) {
        return;
      }
      navigation.goBack();
    } catch (error) {
      if (isAbortedRequest(error) || controller.signal.aborted) {
        return;
      }

      Alert.alert("Erro", getApiErrorMessage(error));
    } finally {
      requestManager.finish("order.cancel", controller);

      if (!controller.signal.aborted) {
        setIsCancelling(false);
      }
    }
  }

  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: layout.contentPadding, paddingTop: layout.contentPadding },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <ConfirmModal
        confirmLabel="Cancelar pedido"
        isDestructive
        message={`Deseja cancelar o pedido #${order.id.slice(0, 8).toUpperCase()}? Esta ação não pode ser desfeita.`}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          handleCancel();
        }}
        title="Cancelar pedido"
        visible={showCancelModal}
      />

      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { borderColor: activeColor }]}>
            <View style={[styles.statusDot, { backgroundColor: activeColor }]} />
            <Text style={[styles.statusText, { color: activeColor }]}>
              {ORDER_STEPS.find((s) => s.key === order.status)?.label ?? order.status}
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <MaterialCommunityIcons
            color={theme.colors.warning}
            name="moped-electric-outline"
            size={28}
          />
          <Text style={styles.heroTitle}>Pedido de Delivery</Text>
          <Text style={styles.heroId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.heroCopy}>{description}</Text>
        </View>

        <View style={styles.trackerCard}>
          <Text style={styles.trackerTitle}>Andamento do pedido</Text>
          <StepTracker status={order.status} />
        </View>

        <View style={styles.infoCard}>
          <InfoRow
            icon="currency-brl"
            label="Total"
            value={formatCurrency(order.totalCents)}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="clock-outline"
            label="Pedido realizado em"
            value={createdDate}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="identifier"
            label="ID do pedido"
            value={order.id}
          />
        </View>

        {isCancellable ? (
          <View style={styles.cancelSection}>
            <Pressable
              accessibilityLabel="Cancelar pedido"
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
                    name="close-circle-outline"
                    size={18}
                  />
                  <Text style={styles.cancelButtonText}>Cancelar pedido</Text>
                </>
              )}
            </Pressable>
            <Text style={styles.cancelHint}>
              Pedidos cancelados não podem ser reativados.
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

OrderTrackingScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      order: PropTypes.shape({
        id: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        totalCents: PropTypes.number.isRequired,
        createdAt: PropTypes.string.isRequired,
        fulfillmentType: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    alignItems: "center",
    paddingBottom: theme.overlays.scrollBottomSafeArea,
  },
  shell: {
    width: "100%",
  },
  statusRow: {
    alignItems: "center",
    marginBottom: 20,
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
  statusText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.4,
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
  heroTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 22,
    letterSpacing: 0.3,
    marginTop: 4,
    textAlign: "center",
  },
  heroId: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    textAlign: "center",
  },
  trackerCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,217,138,0.12)",
    borderWidth: 1,
    marginBottom: 16,
    padding: theme.spacing.lg,
    width: "100%",
  },
  trackerTitle: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 20,
    textTransform: "uppercase",
  },
  stepTracker: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
    gap: 6,
    position: "relative",
  },
  connector: {
    height: 2,
    left: "-50%",
    position: "absolute",
    top: 14,
    width: "100%",
    zIndex: 0,
  },
  stepDot: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
    zIndex: 1,
  },
  stepLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 9,
    letterSpacing: 0.3,
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
  divider: {
    backgroundColor: "rgba(255,217,138,0.1)",
    height: 1,
    marginVertical: 4,
  },
  infoRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    lineHeight: 20,
  },
  cancelSection: {
    gap: 10,
    marginBottom: 12,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "rgba(248,113,113,0.4)",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelButtonPressed: {
    backgroundColor: "rgba(248,113,113,0.08)",
  },
  cancelButtonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: "#f87171",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
  },
  cancelHint: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});
