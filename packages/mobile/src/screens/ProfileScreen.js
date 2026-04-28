import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AddressFields } from "../components/AddressFields";
import { KeyboardScrollScreen } from "../components/KeyboardScrollScreen";
import { SectionHeader } from "../components/SectionHeader";
import { useAuth } from "../context/AuthContext";
import {
  fetchOrders,
  fetchReservations,
  getApiErrorMessage,
  lookupPostalCode,
  savePrimaryAddress,
} from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { theme } from "../theme/tokens";
import {
  createEmptyAddress,
  isAddressComplete,
  mapSavedAddressToForm,
  normalizePostalCode,
} from "../utils/address";

export function ProfileScreen() {
  const { logout, refreshUser, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [addressForm, setAddressForm] = useState(createEmptyAddress());
  const [isLookingUpPostalCode, setIsLookingUpPostalCode] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressSaveFeedback, setAddressSaveFeedback] = useState({
    tone: "idle",
    message: "",
  });
  const [showAddressEditor, setShowAddressEditor] = useState(false);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAddressForm(mapSavedAddressToForm(user?.savedAddresses?.[0]));
  }, [user]);

  const latestOrder = useMemo(
    () => getMostRecent(orders, "createdAt"),
    [orders],
  );
  const latestReservation = useMemo(
    () => getMostRecent(reservations, "scheduledAt"),
    [reservations],
  );

  const primaryAddress = user?.savedAddresses?.[0];

  async function loadProfile() {
    try {
      const [currentUser, nextOrders, nextReservations] = await Promise.all([
        refreshUser(),
        fetchOrders(),
        fetchReservations(),
      ]);

      setOrders(nextOrders);
      setReservations(nextReservations);
      setAddressForm(mapSavedAddressToForm(currentUser?.savedAddresses?.[0]));
      setShowAddressEditor(false);
    } catch (error) {
      Alert.alert("Falha ao carregar perfil", getApiErrorMessage(error));
    }
  }

  function updateAddressField(field, value) {
    if (addressSaveFeedback.tone !== "idle") {
      setAddressSaveFeedback({ tone: "idle", message: "" });
    }
    setAddressForm((current) => ({ ...current, [field]: value }));
  }

  async function handlePostalCodeLookup() {
    if (normalizePostalCode(addressForm.postalCode).length !== 8) {
      Alert.alert("CEP inválido", "Informe um CEP com 8 dígitos.");
      return;
    }

    setIsLookingUpPostalCode(true);

    try {
      const cepData = await lookupPostalCode(addressForm.postalCode);
      setAddressForm((current) => ({
        ...current,
        postalCode: cepData.postalCode,
        street: cepData.street || current.street,
        neighborhood: cepData.neighborhood || current.neighborhood,
        city: cepData.city || current.city,
        state: cepData.state || current.state,
        complement: current.complement || cepData.complement || "",
      }));
    } catch (error) {
      Alert.alert("Falha ao buscar CEP", error.message);
    } finally {
      setIsLookingUpPostalCode(false);
    }
  }

  async function handleSavePrimaryAddress() {
    if (!isAddressComplete(addressForm)) {
      setAddressSaveFeedback({
        tone: "error",
        message: "Preencha todos os campos obrigatórios para salvar.",
      });
      Alert.alert(
        "Endereço incompleto",
        "Preencha CEP, rua, número, bairro, cidade e UF.",
      );
      return;
    }

    setAddressSaveFeedback({
      tone: "saving",
      message: "Salvando endereço principal...",
    });
    setIsSavingAddress(true);

    try {
      await savePrimaryAddress({
        label: "Principal",
        postalCode: addressForm.postalCode,
        street: addressForm.street,
        number: addressForm.number,
        complement: addressForm.complement.trim() || undefined,
        neighborhood: addressForm.neighborhood,
        city: addressForm.city,
        state: addressForm.state,
      });

      const currentUser = await refreshUser();
      setAddressForm(mapSavedAddressToForm(currentUser.savedAddresses?.[0]));
      setShowAddressEditor(false);
      setAddressSaveFeedback({
        tone: "success",
        message: "Endereço principal salvo com sucesso.",
      });
      Alert.alert("Endereço salvo", "Seu endereço principal foi atualizado.");
    } catch (error) {
      setAddressSaveFeedback({
        tone: "error",
        message: getApiErrorMessage(error),
      });
      Alert.alert("Falha ao salvar endereço", getApiErrorMessage(error));
    } finally {
      setIsSavingAddress(false);
    }
  }

  function handleStartAddressEditor() {
    setAddressSaveFeedback({ tone: "idle", message: "" });
    setAddressForm(mapSavedAddressToForm(user?.savedAddresses?.[0]));
    setShowAddressEditor(true);
  }

  function handleCancelAddressEditor() {
    setAddressSaveFeedback({ tone: "idle", message: "" });
    setAddressForm(mapSavedAddressToForm(user?.savedAddresses?.[0]));
    setShowAddressEditor(false);
  }

  return (
    <ProfileContent
      addressForm={addressForm}
      addressSaveFeedback={addressSaveFeedback}
      isLookingUpPostalCode={isLookingUpPostalCode}
      isSavingAddress={isSavingAddress}
      latestOrder={latestOrder}
      latestReservation={latestReservation}
      loadProfile={loadProfile}
      logout={logout}
      onCancelAddressEditor={handleCancelAddressEditor}
      onLookupPostalCode={handlePostalCodeLookup}
      onSavePrimaryAddress={handleSavePrimaryAddress}
      onStartAddressEditor={handleStartAddressEditor}
      onUpdateAddressField={updateAddressField}
      orders={orders}
      primaryAddress={primaryAddress}
      reservations={reservations}
      showAddressEditor={showAddressEditor}
      user={user}
    />
  );
}

function ProfileContent({
  addressForm,
  addressSaveFeedback,
  isLookingUpPostalCode,
  isSavingAddress,
  latestOrder,
  latestReservation,
  loadProfile,
  logout,
  onCancelAddressEditor,
  onLookupPostalCode,
  onSavePrimaryAddress,
  onStartAddressEditor,
  onUpdateAddressField,
  orders,
  primaryAddress,
  reservations,
  showAddressEditor,
  user,
}) {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const shouldShowAddressEditor = showAddressEditor || !primaryAddress;

  return (
    <KeyboardScrollScreen
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: layout.contentPadding,
          paddingTop: layout.contentPadding,
        },
      ]}
      extraKeyboardSpace={56}
      style={styles.screen}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <ProfileHero user={user} />

        <ProfileMetrics
          ordersCount={orders.length}
          reservationsCount={reservations.length}
        />

        <ProfileQuickActions loadProfile={loadProfile} />

        <View style={styles.mainGrid}>
          <View style={styles.primaryColumn}>
            <AddressSection
              addressForm={addressForm}
              addressSaveFeedback={addressSaveFeedback}
              hasAddress={Boolean(primaryAddress)}
              isLookingUpPostalCode={isLookingUpPostalCode}
              isSavingAddress={isSavingAddress}
              onCancelAddressEditor={onCancelAddressEditor}
              onLookupPostalCode={onLookupPostalCode}
              onSavePrimaryAddress={onSavePrimaryAddress}
              onStartAddressEditor={onStartAddressEditor}
              onUpdateAddressField={onUpdateAddressField}
              primaryAddress={primaryAddress}
              shouldShowAddressEditor={shouldShowAddressEditor}
            />
          </View>

          <View style={styles.secondaryColumn}>
            <SectionHeader
              description="Últimas interações resumidas, sem ocupar espaço demais."
              eyebrow="Resumo"
              title="Últimos movimentos"
            />

            <View style={styles.activityStack}>
              <CompactActivityCard
                emptyCopy="Nenhum pedido registrado ainda."
                emptyIcon="receipt-text-outline"
                icon="receipt-text-outline"
                label="Pedido recente"
                meta={formatOrderMeta(latestOrder)}
                title={formatOrderTitle(latestOrder)}
              />

              <CompactActivityCard
                emptyCopy="Nenhuma reserva confirmada ainda."
                emptyIcon="calendar-month-outline"
                icon="calendar-month-outline"
                label="Reserva recente"
                meta={formatReservationMeta(latestReservation)}
                title={formatReservationTitle(latestReservation)}
              />
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={logout}
          style={styles.logoutButton}
        >
          <MaterialCommunityIcons
            color={theme.colors.danger}
            name="logout"
            size={18}
          />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </Pressable>
      </View>
    </KeyboardScrollScreen>
  );
}

ProfileContent.propTypes = {
  addressForm: PropTypes.shape({
    city: PropTypes.string.isRequired,
    complement: PropTypes.string.isRequired,
    neighborhood: PropTypes.string.isRequired,
    number: PropTypes.string.isRequired,
    postalCode: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    street: PropTypes.string.isRequired,
  }).isRequired,
  addressSaveFeedback: PropTypes.shape({
    message: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(["idle", "saving", "success", "error"]).isRequired,
  }).isRequired,
  isLookingUpPostalCode: PropTypes.bool.isRequired,
  isSavingAddress: PropTypes.bool.isRequired,
  latestOrder: PropTypes.shape({
    createdAt: PropTypes.string.isRequired,
    fulfillmentType: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    totalCents: PropTypes.number.isRequired,
  }),
  latestReservation: PropTypes.shape({
    branchName: PropTypes.string.isRequired,
    depthLevel: PropTypes.string.isRequired,
    scheduledAt: PropTypes.string.isRequired,
  }),
  loadProfile: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  onCancelAddressEditor: PropTypes.func.isRequired,
  onLookupPostalCode: PropTypes.func.isRequired,
  onSavePrimaryAddress: PropTypes.func.isRequired,
  onStartAddressEditor: PropTypes.func.isRequired,
  onUpdateAddressField: PropTypes.func.isRequired,
  orders: PropTypes.array.isRequired,
  primaryAddress: PropTypes.shape({
    label: PropTypes.string,
    summary: PropTypes.string,
  }),
  reservations: PropTypes.array.isRequired,
  showAddressEditor: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    email: PropTypes.string,
    name: PropTypes.string,
  }),
};

function ProfileHero({ user }) {
  return (
    <LinearGradient
      colors={["#07111f", "#0b1b31", "#132847"]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.hero}
    >
      <View style={styles.heroTop}>
        <View style={styles.identityCopy}>
          <Text style={styles.heroEyebrow}>Conta</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.heroCopy}>
            Endereço principal, pedidos recentes e reservas, tudo em um lugar.
          </Text>
        </View>

      </View>
    </LinearGradient>
  );
}

ProfileHero.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
    name: PropTypes.string,
  }),
};

function ProfileMetrics({ ordersCount, reservationsCount }) {
  return (
    <View style={styles.metricsRow}>
      <MetricCard
        icon="receipt-text-outline"
        label="Pedidos"
        value={String(ordersCount)}
      />
      <MetricCard
        icon="calendar-month-outline"
        label="Reservas"
        value={String(reservationsCount)}
      />
    </View>
  );
}

ProfileMetrics.propTypes = {
  ordersCount: PropTypes.number.isRequired,
  reservationsCount: PropTypes.number.isRequired,
};

function ProfileQuickActions({ loadProfile }) {
  return (
    <View style={styles.quickActionsCard}>
      <QuickAction
        icon="cached"
        label="Sincronizar conta"
        onPress={loadProfile}
      />
    </View>
  );
}

ProfileQuickActions.propTypes = {
  loadProfile: PropTypes.func.isRequired,
};

function AddressSection({
  addressForm,
  addressSaveFeedback,
  hasAddress,
  isLookingUpPostalCode,
  isSavingAddress,
  onCancelAddressEditor,
  onLookupPostalCode,
  onSavePrimaryAddress,
  onStartAddressEditor,
  onUpdateAddressField,
  primaryAddress,
  shouldShowAddressEditor,
}) {
  const showSummaryEditButton = hasAddress && shouldShowAddressEditor === false;
  const showEditor = shouldShowAddressEditor;
  const showCancelButton = hasAddress;
  const showAddressFeedback = addressSaveFeedback.tone !== "idle";

  return (
    <>
      <SectionHeader
        description="Seu endereço principal fica em destaque e pode ser ajustado quando preciso."
        eyebrow="Entrega"
        title="Endereço principal"
      />

      <View style={styles.cardBlock}>
        {hasAddress ? (
          <AddressSummaryCard
            onStartAddressEditor={onStartAddressEditor}
            primaryAddress={primaryAddress}
            showSummaryEditButton={showSummaryEditButton}
          />
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              color={theme.colors.warning}
              name="map-marker"
              size={28}
            />
            <Text style={styles.emptyTitle}>Nenhum endereço salvo ainda.</Text>
            <Text style={styles.emptyCopy}>
              Salve um endereço principal para deixar seus pedidos mais rápidos.
            </Text>
          </View>
        )}

        {showEditor ? (
          <AddressEditorPanel
            addressForm={addressForm}
            addressSaveFeedback={addressSaveFeedback}
            isLookingUpPostalCode={isLookingUpPostalCode}
            isSavingAddress={isSavingAddress}
            onCancelAddressEditor={onCancelAddressEditor}
            onLookupPostalCode={onLookupPostalCode}
            onSavePrimaryAddress={onSavePrimaryAddress}
            onUpdateAddressField={onUpdateAddressField}
            showAddressFeedback={showAddressFeedback}
            showCancelButton={showCancelButton}
          />
        ) : null}
      </View>
    </>
  );
}

function AddressSummaryCard({
  onStartAddressEditor,
  primaryAddress,
  showSummaryEditButton,
}) {
  return (
    <View style={styles.addressSummaryCard}>
      <View style={styles.addressSummaryTop}>
        <View style={styles.addressSummaryContent}>
          <View style={styles.addressSummaryTitleRow}>
            <MaterialCommunityIcons
              color={theme.colors.accentSoft}
              name="map-marker-check-outline"
              size={18}
            />
            <Text style={styles.addressSummaryTitle}>
              {primaryAddress?.label || "Principal"}
            </Text>
          </View>
          <Text style={styles.addressSummaryCopy}>
            {primaryAddress?.summary}
          </Text>
        </View>
        <MaterialCommunityIcons
          color={theme.colors.accentSoft}
          name="home-heart"
          size={22}
        />
      </View>
      {showSummaryEditButton ? (
        <Pressable
          accessibilityRole="button"
          onPress={onStartAddressEditor}
          style={styles.addressSummaryEditButton}
        >
          <MaterialCommunityIcons
            color={theme.colors.accentSoft}
            name="pencil"
            size={16}
          />
          <Text style={styles.addressSummaryEditButtonText}>Editar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AddressEditorPanel({
  addressForm,
  addressSaveFeedback,
  isLookingUpPostalCode,
  isSavingAddress,
  onCancelAddressEditor,
  onLookupPostalCode,
  onSavePrimaryAddress,
  onUpdateAddressField,
  showAddressFeedback,
  showCancelButton,
}) {
  return (
    <View style={styles.addressPanel}>
      <Text style={styles.panelTitle}>Editar endereço</Text>
      <Text style={styles.panelCopy}>
        O CEP completa os campos principais. Você só confirma o restante.
      </Text>

      <AddressFields
        address={addressForm}
        isLookingUpPostalCode={isLookingUpPostalCode}
        onChangeField={onUpdateAddressField}
        onLookupPostalCode={onLookupPostalCode}
      />

      <Text style={styles.addressHint}>
        CEP, rua e bairro entram rápido. Número e complemento seguem sob seu
        controle.
      </Text>

      {showAddressFeedback ? (
        <View
          style={[
            styles.addressFeedback,
            addressSaveFeedback.tone === "success" &&
              styles.addressFeedbackSuccess,
            addressSaveFeedback.tone === "error" && styles.addressFeedbackError,
          ]}
        >
          {addressSaveFeedback.tone === "saving" ? (
            <ActivityIndicator color={theme.colors.accentSoft} size="small" />
          ) : null}
          <Text style={styles.addressFeedbackText}>
            {addressSaveFeedback.message}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={isSavingAddress}
        onPress={onSavePrimaryAddress}
        style={[styles.primaryButton, isSavingAddress && styles.buttonDisabled]}
      >
        <View style={styles.primaryButtonContent}>
          {isSavingAddress ? (
            <ActivityIndicator color={theme.colors.background} size="small" />
          ) : null}
          <Text style={styles.primaryButtonText}>
            {isSavingAddress ? "Salvando..." : "Salvar endereço principal"}
          </Text>
        </View>
      </Pressable>

      {showCancelButton ? (
        <Pressable
          accessibilityRole="button"
          disabled={isSavingAddress}
          onPress={onCancelAddressEditor}
          style={[
            styles.cancelButton,
            isSavingAddress && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.cancelButtonText}>Cancelar edição</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

AddressSection.propTypes = {
  addressForm: PropTypes.shape({
    city: PropTypes.string.isRequired,
    complement: PropTypes.string.isRequired,
    neighborhood: PropTypes.string.isRequired,
    number: PropTypes.string.isRequired,
    postalCode: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    street: PropTypes.string.isRequired,
  }).isRequired,
  addressSaveFeedback: PropTypes.shape({
    message: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(["idle", "saving", "success", "error"]).isRequired,
  }).isRequired,
  hasAddress: PropTypes.bool.isRequired,
  isLookingUpPostalCode: PropTypes.bool.isRequired,
  isSavingAddress: PropTypes.bool.isRequired,
  onCancelAddressEditor: PropTypes.func.isRequired,
  onLookupPostalCode: PropTypes.func.isRequired,
  onSavePrimaryAddress: PropTypes.func.isRequired,
  onStartAddressEditor: PropTypes.func.isRequired,
  onUpdateAddressField: PropTypes.func.isRequired,
  primaryAddress: PropTypes.shape({
    label: PropTypes.string,
    summary: PropTypes.string,
  }),
  shouldShowAddressEditor: PropTypes.bool.isRequired,
};

AddressSummaryCard.propTypes = {
  onStartAddressEditor: PropTypes.func.isRequired,
  primaryAddress: PropTypes.shape({
    label: PropTypes.string,
    summary: PropTypes.string,
  }),
  showSummaryEditButton: PropTypes.bool.isRequired,
};

AddressEditorPanel.propTypes = {
  addressForm: PropTypes.shape({
    city: PropTypes.string.isRequired,
    complement: PropTypes.string.isRequired,
    neighborhood: PropTypes.string.isRequired,
    number: PropTypes.string.isRequired,
    postalCode: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    street: PropTypes.string.isRequired,
  }).isRequired,
  addressSaveFeedback: PropTypes.shape({
    message: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(["idle", "saving", "success", "error"]).isRequired,
  }).isRequired,
  isLookingUpPostalCode: PropTypes.bool.isRequired,
  isSavingAddress: PropTypes.bool.isRequired,
  onCancelAddressEditor: PropTypes.func.isRequired,
  onLookupPostalCode: PropTypes.func.isRequired,
  onSavePrimaryAddress: PropTypes.func.isRequired,
  onUpdateAddressField: PropTypes.func.isRequired,
  showAddressFeedback: PropTypes.bool.isRequired,
  showCancelButton: PropTypes.bool.isRequired,
};

function CompactActivityCard({
  emptyCopy,
  emptyIcon,
  icon,
  label,
  meta,
  title,
}) {
  const isEmpty = !title && !meta;

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityCardTop}>
        <View style={styles.activityBadge}>
          <MaterialCommunityIcons
            color={theme.colors.accentSoft}
            name={icon}
            size={18}
          />
        </View>
        <Text style={styles.activityLabel}>{label}</Text>
      </View>

      {isEmpty ? (
        <View style={styles.activityEmptyRow}>
          <MaterialCommunityIcons
            color={theme.colors.accentSoft}
            name={emptyIcon}
            size={18}
          />
          <Text style={styles.activityEmptyCopy}>{emptyCopy}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.activityTitle}>{title}</Text>
          <Text style={styles.activityMeta}>{meta}</Text>
        </>
      )}
    </View>
  );
}

CompactActivityCard.propTypes = {
  emptyCopy: PropTypes.string.isRequired,
  emptyIcon: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  meta: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

function MetricCard({ icon, label, value }) {
  return (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons
        color={theme.colors.warning}
        name={icon}
        size={18}
      />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

MetricCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

function QuickAction({ disabled = false, icon, label, onPress }) {
  const Component = disabled ? View : Pressable;

  return (
    <Component
      accessibilityRole={disabled ? undefined : "button"}
      onPress={disabled ? undefined : onPress}
      style={[styles.quickAction, disabled && styles.quickActionDisabled]}
    >
      <MaterialCommunityIcons
        color={theme.colors.warning}
        name={icon}
        size={18}
      />
      <Text style={styles.quickActionText}>{label}</Text>
    </Component>
  );
}

QuickAction.propTypes = {
  disabled: PropTypes.bool,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

function getMostRecent(items, dateField) {
  return [...items].sort(
    (left, right) =>
      new Date(right[dateField]).getTime() -
      new Date(left[dateField]).getTime(),
  )[0];
}

function formatOrderTitle(order) {
  if (!order) {
    return "";
  }

  const fulfillmentLabel =
    order.fulfillmentType === "delivery" ? "Delivery" : "Salão";
  return `${fulfillmentLabel} • ${order.status}`;
}

function formatOrderMeta(order) {
  if (!order) {
    return "";
  }

  return new Date(order.createdAt).toLocaleString("pt-BR");
}

function formatReservationTitle(reservation) {
  return reservation?.branchName || "";
}

function formatReservationMeta(reservation) {
  if (!reservation) {
    return "";
  }

  return new Date(reservation.scheduledAt).toLocaleString("pt-BR");
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
  },
  content: {
    alignItems: "center",
    paddingBottom: theme.overlays.scrollBottomSafeArea,
  },
  shell: {
    width: "100%",
  },
  hero: {
    borderRadius: 0,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  heroTop: {
    gap: 12,
  },
  identityCopy: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 34,
    lineHeight: 36,
  },
  email: {
    color: "rgba(245,251,255,0.86)",
    fontFamily: theme.fonts.body,
    fontSize: 14,
    marginTop: 2,
  },
  heroCopy: {
    color: "rgba(245,251,255,0.74)",
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 520,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  metricCard: {
    alignItems: "flex-start",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minWidth: 132,
    padding: 14,
  },
  metricValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 26,
    lineHeight: 28,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
  quickActionsCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    flexDirection: "column",
    gap: 10,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickActionDisabled: {
    opacity: 0.7,
  },
  quickActionText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
  },
  mainGrid: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  logoutButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,139,156,0.28)",
    borderRadius: 0,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  primaryColumn: {
    flex: 1,
  },
  secondaryColumn: {
    gap: theme.spacing.md,
  },
  cardBlock: {
    gap: theme.spacing.md,
  },
  addressSummaryCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  addressSummaryTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  addressSummaryContent: {
    flex: 1,
    minWidth: 0,
  },
  addressSummaryTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  addressSummaryTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    flexShrink: 1,
  },
  addressSummaryCopy: {
    color: theme.colors.textMuted,
    flexShrink: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  addressSummaryEditButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  addressSummaryEditButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
  },
  emptyCard: {
    alignItems: "flex-start",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    gap: 8,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  addressPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    gap: 14,
    padding: theme.spacing.lg,
  },
  panelTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
  },
  panelCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -6,
  },
  addressHint: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  addressFeedback: {
    alignItems: "center",
    backgroundColor: "rgba(49,231,255,0.08)",
    borderColor: "rgba(49,231,255,0.3)",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addressFeedbackSuccess: {
    backgroundColor: "rgba(114,240,184,0.08)",
    borderColor: "rgba(114,240,184,0.3)",
  },
  addressFeedbackError: {
    backgroundColor: "rgba(255,139,156,0.08)",
    borderColor: "rgba(255,139,156,0.34)",
  },
  addressFeedbackText: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 0,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  activityStack: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    gap: 8,
    padding: theme.spacing.lg,
  },
  activityCardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  activityBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 0,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  activityLabel: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  activityTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
  },
  activityMeta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
  activityEmptyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  activityEmptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
});
