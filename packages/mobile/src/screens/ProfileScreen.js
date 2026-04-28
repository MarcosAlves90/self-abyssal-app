import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
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
  savePrimaryAddress
} from "../services/api";
import { getResponsiveLayout } from "../theme/layout";
import { formatCurrency, theme } from "../theme/tokens";
import {
  createEmptyAddress,
  isAddressComplete,
  mapSavedAddressToForm,
  normalizePostalCode
} from "../utils/address";

export function ProfileScreen() {
  const { logout, refreshUser, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [addressForm, setAddressForm] = useState(createEmptyAddress());
  const [isLookingUpPostalCode, setIsLookingUpPostalCode] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showAddressEditor, setShowAddressEditor] = useState(false);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAddressForm(mapSavedAddressToForm(user?.savedAddresses?.[0]));
  }, [user]);

  const latestOrder = useMemo(() => getMostRecent(orders, "createdAt"), [orders]);
  const latestReservation = useMemo(
    () => getMostRecent(reservations, "scheduledAt"),
    [reservations]
  );

  const primaryAddress = user?.savedAddresses?.[0];

  async function loadProfile() {
    try {
      const [currentUser, nextOrders, nextReservations] = await Promise.all([
        refreshUser(),
        fetchOrders(),
        fetchReservations()
      ]);

      setOrders(nextOrders);
      setReservations(nextReservations);
      setAddressForm(mapSavedAddressToForm(currentUser?.savedAddresses?.[0]));
      setShowAddressEditor(Boolean(currentUser?.savedAddresses?.[0]));
    } catch (error) {
      Alert.alert("Falha ao carregar perfil", getApiErrorMessage(error));
    }
  }

  function updateAddressField(field, value) {
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
        complement: current.complement || cepData.complement || ""
      }));
    } catch (error) {
      Alert.alert("Falha ao buscar CEP", error.message);
    } finally {
      setIsLookingUpPostalCode(false);
    }
  }

  async function handleSavePrimaryAddress() {
    if (!isAddressComplete(addressForm)) {
      Alert.alert(
        "Endereço incompleto",
        "Preencha CEP, rua, número, bairro, cidade e UF."
      );
      return;
    }

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
        state: addressForm.state
      });

      const currentUser = await refreshUser();
      setAddressForm(mapSavedAddressToForm(currentUser.savedAddresses?.[0]));
      setShowAddressEditor(true);
      Alert.alert("Endereço salvo", "Seu endereço principal foi atualizado.");
    } catch (error) {
      Alert.alert("Falha ao salvar endereço", getApiErrorMessage(error));
    } finally {
      setIsSavingAddress(false);
    }
  }

  return (
    <ProfileContent
      addressForm={addressForm}
      isLookingUpPostalCode={isLookingUpPostalCode}
      isSavingAddress={isSavingAddress}
      latestOrder={latestOrder}
      latestReservation={latestReservation}
      loadProfile={loadProfile}
      logout={logout}
      onLookupPostalCode={handlePostalCodeLookup}
      onSavePrimaryAddress={handleSavePrimaryAddress}
      onToggleAddressEditor={() => setShowAddressEditor((current) => !current)}
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
  isLookingUpPostalCode,
  isSavingAddress,
  latestOrder,
  latestReservation,
  loadProfile,
  logout,
  onLookupPostalCode,
  onSavePrimaryAddress,
  onToggleAddressEditor,
  onUpdateAddressField,
  orders,
  primaryAddress,
  reservations,
  showAddressEditor,
  user
}) {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const shouldShowAddressEditor = showAddressEditor || !primaryAddress;

  return (
    <KeyboardScrollScreen
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: layout.contentPadding, paddingTop: layout.contentPadding }
      ]}
      extraKeyboardSpace={56}
      style={styles.screen}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <ProfileHero
          loadProfile={loadProfile}
          user={user}
        />

        <ProfileMetrics
          hasAddress={Boolean(primaryAddress)}
          ordersCount={orders.length}
          reservationsCount={reservations.length}
        />

        <ProfileQuickActions
          hasAddress={Boolean(primaryAddress)}
          loadProfile={loadProfile}
          onToggleAddressEditor={onToggleAddressEditor}
        />

        <View style={styles.mainGrid}>
          <View style={styles.primaryColumn}>
            <AddressSection
              addressForm={addressForm}
              hasAddress={Boolean(primaryAddress)}
              isLookingUpPostalCode={isLookingUpPostalCode}
              isSavingAddress={isSavingAddress}
              onLookupPostalCode={onLookupPostalCode}
              onSavePrimaryAddress={onSavePrimaryAddress}
              onToggleAddressEditor={onToggleAddressEditor}
              onUpdateAddressField={onUpdateAddressField}
              primaryAddress={primaryAddress}
              shouldShowAddressEditor={shouldShowAddressEditor}
            />
          </View>

          <View style={styles.secondaryColumn}>
            <SectionHeader
              description="Resumo enxuto das últimas interações da conta, sem poluir a tela."
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
                subtitle={formatOrderSubtitle(latestOrder)}
                title={formatOrderTitle(latestOrder)}
              />

              <CompactActivityCard
                emptyCopy="Nenhuma reserva confirmada ainda."
                emptyIcon="calendar-month-outline"
                icon="calendar-month-outline"
                label="Reserva recente"
                meta={formatReservationMeta(latestReservation)}
                subtitle={formatReservationSubtitle(latestReservation)}
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
    street: PropTypes.string.isRequired
  }).isRequired,
  isLookingUpPostalCode: PropTypes.bool.isRequired,
  isSavingAddress: PropTypes.bool.isRequired,
  latestOrder: PropTypes.shape({
    createdAt: PropTypes.string.isRequired,
    fulfillmentType: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    totalCents: PropTypes.number.isRequired
  }),
  latestReservation: PropTypes.shape({
    branchName: PropTypes.string.isRequired,
    depthLevel: PropTypes.string.isRequired,
    scheduledAt: PropTypes.string.isRequired
  }),
  loadProfile: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  onLookupPostalCode: PropTypes.func.isRequired,
  onSavePrimaryAddress: PropTypes.func.isRequired,
  onToggleAddressEditor: PropTypes.func.isRequired,
  onUpdateAddressField: PropTypes.func.isRequired,
  orders: PropTypes.array.isRequired,
  primaryAddress: PropTypes.shape({
    label: PropTypes.string,
    summary: PropTypes.string
  }),
  reservations: PropTypes.array.isRequired,
  showAddressEditor: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    email: PropTypes.string,
    name: PropTypes.string
  })
};

function ProfileHero({ loadProfile, user }) {
  return (
    <LinearGradient
      colors={["#08172c", "#0b203d", "#13345b"]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.hero}
    >
      <View style={styles.heroTop}>
        <View style={styles.identityCopy}>
          <Text style={styles.heroEyebrow}>Perfil</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.heroActions}>
          <ActionButton label="Atualizar" icon="refresh" onPress={loadProfile} />
        </View>
      </View>
    </LinearGradient>
  );
}

ProfileHero.propTypes = {
  loadProfile: PropTypes.func.isRequired,
  user: PropTypes.shape({
    email: PropTypes.string,
    name: PropTypes.string
  })
};

function ProfileMetrics({ hasAddress, ordersCount, reservationsCount }) {
  return (
    <View style={styles.metricsRow}>
      <MetricCard icon="receipt-text-outline" label="Pedidos" value={String(ordersCount)} />
      <MetricCard icon="calendar-month-outline" label="Reservas" value={String(reservationsCount)} />
      <MetricCard
        icon={hasAddress ? "map-marker-check" : "map-marker-off-outline"}
        label="Endereço"
        value={hasAddress ? "Pronto" : "Pendente"}
      />
    </View>
  );
}

ProfileMetrics.propTypes = {
  hasAddress: PropTypes.bool.isRequired,
  ordersCount: PropTypes.number.isRequired,
  reservationsCount: PropTypes.number.isRequired
};

function ProfileQuickActions({ hasAddress, loadProfile, onToggleAddressEditor }) {
  return (
    <View style={styles.quickActionsCard}>
      <QuickAction
        icon="map-marker-radius"
        label={hasAddress ? "Editar endereço" : "Adicionar endereço"}
        onPress={onToggleAddressEditor}
      />
      <QuickAction icon="cached" label="Sincronizar conta" onPress={loadProfile} />
      <QuickAction icon="shield-account-outline" label="Conta segura" disabled />
    </View>
  );
}

ProfileQuickActions.propTypes = {
  hasAddress: PropTypes.bool.isRequired,
  loadProfile: PropTypes.func.isRequired,
  onToggleAddressEditor: PropTypes.func.isRequired
};

function AddressSection({
  addressForm,
  hasAddress,
  isLookingUpPostalCode,
  isSavingAddress,
  onLookupPostalCode,
  onSavePrimaryAddress,
  onToggleAddressEditor,
  onUpdateAddressField,
  primaryAddress,
  shouldShowAddressEditor
}) {
  return (
    <>
      <SectionHeader
        description="Seu endereço principal fica visível em destaque, com edição quando você quiser."
        eyebrow="Entrega"
        title="Endereço principal"
      />

      <View style={styles.cardBlock}>
        {hasAddress ? (
          <View style={styles.addressSummaryCard}>
            <View style={styles.addressSummaryTop}>
              <View>
                <Text style={styles.addressSummaryTitle}>
                  {primaryAddress?.label || "Principal"}
                </Text>
                <Text style={styles.addressSummaryCopy}>{primaryAddress?.summary}</Text>
              </View>
              <MaterialCommunityIcons
                color={theme.colors.accentSoft}
                name="home-heart"
                size={22}
              />
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons color={theme.colors.accentSoft} name="map-marker" size={28} />
            <Text style={styles.emptyTitle}>Nenhum endereço salvo ainda.</Text>
            <Text style={styles.emptyCopy}>
              Salve um endereço principal para deixar seus pedidos mais rápidos.
            </Text>
          </View>
        )}

        {shouldShowAddressEditor ? (
          <View style={styles.addressPanel}>
            <Text style={styles.panelTitle}>Editar endereço</Text>
            <Text style={styles.panelCopy}>
              O CEP preenche automaticamente os campos principais. Você só revisa o que importa.
            </Text>

            <AddressFields
              address={addressForm}
              isLookingUpPostalCode={isLookingUpPostalCode}
              onChangeField={onUpdateAddressField}
              onLookupPostalCode={onLookupPostalCode}
            />

            <Text style={styles.addressHint}>
              Cep, rua e bairro entram rápido. Número e complemento continuam sob seu controle.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={isSavingAddress}
              onPress={onSavePrimaryAddress}
              style={[styles.primaryButton, isSavingAddress && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {isSavingAddress ? "Salvando..." : "Salvar endereço principal"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onToggleAddressEditor}
            style={styles.inlineSecondaryButton}
          >
            <MaterialCommunityIcons color={theme.colors.accentSoft} name="pencil" size={18} />
            <Text style={styles.inlineSecondaryButtonText}>Editar endereço</Text>
          </Pressable>
        )}
      </View>
    </>
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
    street: PropTypes.string.isRequired
  }).isRequired,
  hasAddress: PropTypes.bool.isRequired,
  isLookingUpPostalCode: PropTypes.bool.isRequired,
  isSavingAddress: PropTypes.bool.isRequired,
  onLookupPostalCode: PropTypes.func.isRequired,
  onSavePrimaryAddress: PropTypes.func.isRequired,
  onToggleAddressEditor: PropTypes.func.isRequired,
  onUpdateAddressField: PropTypes.func.isRequired,
  primaryAddress: PropTypes.shape({
    label: PropTypes.string,
    summary: PropTypes.string
  }),
  shouldShowAddressEditor: PropTypes.bool.isRequired
};

function CompactActivityCard({ emptyCopy, emptyIcon, icon, label, meta, subtitle, title }) {
  const isEmpty = !title && !subtitle && !meta;

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityCardTop}>
        <View style={styles.activityBadge}>
          <MaterialCommunityIcons color={theme.colors.accentSoft} name={icon} size={18} />
        </View>
        <Text style={styles.activityLabel}>{label}</Text>
      </View>

      {isEmpty ? (
        <View style={styles.activityEmptyRow}>
          <MaterialCommunityIcons color={theme.colors.accentSoft} name={emptyIcon} size={18} />
          <Text style={styles.activityEmptyCopy}>{emptyCopy}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.activityTitle}>{title}</Text>
          <Text style={styles.activitySubtitle}>{subtitle}</Text>
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
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};

function ActionButton({ danger = false, icon, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.actionButton, danger && styles.actionButtonDanger]}
    >
      <MaterialCommunityIcons
        color={danger ? theme.colors.danger : theme.colors.text}
        name={icon}
        size={18}
      />
      <Text style={[styles.actionButtonText, danger && styles.actionButtonTextDanger]}>
        {label}
      </Text>
    </Pressable>
  );
}

ActionButton.propTypes = {
  danger: PropTypes.bool,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

function MetricCard({ icon, label, value }) {
  return (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons color={theme.colors.accentSoft} name={icon} size={18} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

MetricCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

function QuickAction({ disabled = false, icon, label, onPress }) {
  const Component = disabled ? View : Pressable;

  return (
    <Component
      accessibilityRole={disabled ? undefined : "button"}
      onPress={disabled ? undefined : onPress}
      style={[styles.quickAction, disabled && styles.quickActionDisabled]}
    >
      <MaterialCommunityIcons color={theme.colors.accentSoft} name={icon} size={18} />
      <Text style={styles.quickActionText}>{label}</Text>
    </Component>
  );
}

QuickAction.propTypes = {
  disabled: PropTypes.bool,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

function getMostRecent(items, dateField) {
  return [...items].sort(
    (left, right) => new Date(right[dateField]).getTime() - new Date(left[dateField]).getTime()
  )[0];
}

function formatOrderTitle(order) {
  if (!order) {
    return "";
  }

  const fulfillmentLabel = order.fulfillmentType === "delivery" ? "Delivery" : "Salão";
  return `${fulfillmentLabel} • ${order.status}`;
}

function formatOrderSubtitle(order) {
  if (!order) {
    return "";
  }

  return formatCurrency(order.totalCents);
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

function formatReservationSubtitle(reservation) {
  return reservation?.depthLevel || "";
}

function formatReservationMeta(reservation) {
  if (!reservation) {
    return "";
  }

  return new Date(reservation.scheduledAt).toLocaleString("pt-BR");
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background
  },
  content: {
    alignItems: "center",
    paddingBottom: theme.overlays.scrollBottomSafeArea
  },
  shell: {
    width: "100%"
  },
  hero: {
    borderRadius: 0,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl
  },
  heroTop: {
    gap: 18
  },
  identityCopy: {
    flex: 1,
    gap: 2
  },
  heroEyebrow: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 34,
    lineHeight: 36
  },
  email: {
    color: "rgba(245,251,255,0.86)",
    fontFamily: theme.fonts.body,
    fontSize: 14,
    marginTop: 2
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16
  },
  actionButtonDanger: {
    borderColor: "rgba(255,139,156,0.28)"
  },
  actionButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  actionButtonTextDanger: {
    color: theme.colors.danger
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: theme.spacing.md
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
    padding: 16
  },
  metricValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 28,
    lineHeight: 30
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  quickActionsCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    flexDirection: "column",
    gap: 10,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md
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
    paddingVertical: 10
  },
  quickActionDisabled: {
    opacity: 0.7
  },
  quickActionText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  mainGrid: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl
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
    paddingHorizontal: 16
  },
  logoutButtonText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  primaryColumn: {
    flex: 1
  },
  secondaryColumn: {
    gap: theme.spacing.md
  },
  cardBlock: {
    gap: theme.spacing.md
  },
  addressSummaryCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  addressSummaryTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  addressSummaryTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    marginBottom: 6
  },
  addressSummaryCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  },
  emptyCard: {
    alignItems: "flex-start",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    gap: 8,
    padding: theme.spacing.lg
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21
  },
  addressPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    gap: 14,
    padding: theme.spacing.lg
  },
  panelTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16
  },
  panelCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -6
  },
  addressHint: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 18
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 0,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16
  },
  buttonDisabled: {
    opacity: 0.75
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  inlineSecondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  inlineSecondaryButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  activityStack: {
    gap: 12
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 0,
    borderWidth: 1,
    gap: 8,
    padding: theme.spacing.lg
  },
  activityCardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  activityBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 0,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  activityLabel: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  activityTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21
  },
  activitySubtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  activityMeta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  activityEmptyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  activityEmptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 19
  }
});
