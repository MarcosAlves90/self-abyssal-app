import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
  const { width } = useWindowDimensions();
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [addressForm, setAddressForm] = useState(createEmptyAddress());
  const [isLookingUpPostalCode, setIsLookingUpPostalCode] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    setAddressForm(mapSavedAddressToForm(user?.savedAddresses?.[0]));
  }, [user]);

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
    } catch (error) {
      Alert.alert("Falha ao carregar perfil", getApiErrorMessage(error));
    }
  }

  function updateAddressField(field, value) {
    setAddressForm((current) => ({ ...current, [field]: value }));
  }

  async function handlePostalCodeLookup() {
    if (normalizePostalCode(addressForm.postalCode).length !== 8) {
      Alert.alert("CEP invalido", "Informe um CEP com 8 digitos.");
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
        "Endereco incompleto",
        "Preencha CEP, rua, numero, bairro, cidade e UF."
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
      Alert.alert("Endereco salvo", "Seu endereco principal foi atualizado.");
    } catch (error) {
      Alert.alert("Falha ao salvar endereco", getApiErrorMessage(error));
    } finally {
      setIsSavingAddress(false);
    }
  }

  const layout = getResponsiveLayout(width);
  const primaryAddress = user?.savedAddresses?.[0];
  const initial = user?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <KeyboardScrollScreen
      contentContainerStyle={[styles.content, { padding: layout.contentPadding }]}
      extraKeyboardSpace={56}
      style={styles.screen}
    >
      <View style={[styles.shell, { maxWidth: layout.contentMaxWidth }]}>
        <LinearGradient
          colors={["#08172c", "#0b203d", "#13345b"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.hero, layout.isCompact && styles.heroCompact]}
        >
          <View style={[styles.heroTop, layout.isWide && styles.heroTopWide]}>
            <View style={[styles.identityRow, layout.isCompact && styles.identityRowCompact]}>
              <View style={styles.avatar}>
                <Text style={[styles.avatarText, layout.isCompact && styles.avatarTextCompact]}>
                  {initial}
                </Text>
              </View>
              <View style={styles.identityCopy}>
                <Text
                  style={[
                    styles.name,
                    {
                      fontSize: layout.isTiny ? 30 : layout.isCompact ? 36 : 46,
                      lineHeight: layout.isTiny ? 34 : layout.isCompact ? 40 : 48
                    }
                  ]}
                >
                  {user?.name}
                </Text>
                <Text style={styles.email}>{user?.email}</Text>
                <Text style={styles.role}>
                  {user?.role === "admin" ? "Administrador" : "Cliente"}
                </Text>
              </View>
            </View>

            <View style={[styles.heroActions, layout.isCompact && styles.heroActionsCompact]}>
              <ActionButton
                fullWidth={layout.isCompact}
                label="Atualizar"
                onPress={loadProfile}
              />
              <ActionButton
                danger
                fullWidth={layout.isCompact}
                label="Encerrar sessao"
                onPress={logout}
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <SummaryCard
              compact={layout.isCompact}
              label="Reservas"
              minWidth={layout.statCardMinWidth}
              value={String(reservations.length)}
            />
            <SummaryCard
              compact={layout.isCompact}
              label="Pedidos"
              minWidth={layout.statCardMinWidth}
              value={String(orders.length)}
            />
            <SummaryCard
              compact={layout.isCompact}
              label="Endereco"
              minWidth={layout.statCardMinWidth}
              value={primaryAddress ? "Pronto" : "Pendente"}
            />
          </View>
        </LinearGradient>

        <View style={[styles.mainGrid, layout.isWide && styles.mainGridWide]}>
          <View style={styles.primaryColumn}>
            <SectionHeader
              description="Cadastro e edicao do endereco principal com a mesma clareza de apps de conta e checkout."
              eyebrow="Configuracoes"
              title="Endereco principal"
            />

            {primaryAddress ? (
              <View style={styles.addressSummaryCard}>
                <Text style={styles.addressSummaryTitle}>
                  {primaryAddress.label || "Principal"}
                </Text>
                <Text style={styles.addressSummaryCopy}>{primaryAddress.summary}</Text>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nenhum endereco salvo ainda.</Text>
                <Text style={styles.emptyCopy}>
                  Salve aqui quando quiser ou antes do primeiro delivery.
                </Text>
              </View>
            )}

            <View style={styles.addressPanel}>
              <AddressFields
                address={addressForm}
                isLookingUpPostalCode={isLookingUpPostalCode}
                onChangeField={updateAddressField}
                onLookupPostalCode={handlePostalCodeLookup}
              />
              <Text style={styles.addressHint}>
                O CEP preenche rua, bairro, cidade e UF automaticamente. Numero e
                complemento continuam sob seu controle.
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={isSavingAddress}
                onPress={handleSavePrimaryAddress}
                style={[styles.primaryButton, isSavingAddress && styles.buttonDisabled]}
              >
                <Text style={styles.primaryButtonText}>
                  {isSavingAddress ? "Salvando..." : "Salvar endereco principal"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.secondaryColumn, layout.isWide && styles.secondaryColumnWide]}>
            <SectionHeader
              description="Historico em cards compactos, com leitura proxima de apps de mobilidade e conta."
              eyebrow="Historico"
              title="Pedidos recentes"
            />
            {orders.length ? (
              orders.map((order) => (
                <ActivityCard
                  key={order.id}
                  meta={new Date(order.createdAt).toLocaleString("pt-BR")}
                  subtitle={formatCurrency(order.totalCents)}
                  title={`${order.fulfillmentType === "delivery" ? "Delivery" : "Salao"} • ${order.status}`}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nenhum pedido registrado ainda.</Text>
              </View>
            )}

            <SectionHeader
              description="Sua agenda permanece visivel sem competir com os ajustes da conta."
              eyebrow="Agenda"
              title="Reservas"
            />
            {reservations.length ? (
              reservations.map((reservation) => (
                <ActivityCard
                  key={reservation.id}
                  meta={new Date(reservation.scheduledAt).toLocaleString("pt-BR")}
                  subtitle={reservation.depthLevel}
                  title={reservation.branchName}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nenhuma reserva confirmada.</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </KeyboardScrollScreen>
  );
}

function ActionButton({ danger = false, fullWidth = false, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.actionButton,
        fullWidth && styles.actionButtonFullWidth,
        danger && styles.actionButtonDanger
      ]}
    >
      <Text style={[styles.actionButtonText, danger && styles.actionButtonTextDanger]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SummaryCard({ compact = false, label, minWidth, value }) {
  return (
    <View
      style={[
        styles.summaryCard,
        compact && styles.summaryCardCompact,
        { minWidth: compact ? 0 : minWidth }
      ]}
    >
      <Text style={[styles.summaryValue, compact && styles.summaryValueCompact]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ActivityCard({ meta, subtitle, title }) {
  return (
    <View style={styles.activityCard}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
      <Text style={styles.activityMeta}>{meta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background
  },
  content: {
    alignItems: "center",
    padding: theme.spacing.lg,
    paddingBottom: 120
  },
  shell: {
    width: "100%"
  },
  hero: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl
  },
  heroCompact: {
    padding: theme.spacing.lg
  },
  heroTop: {
    gap: 20
  },
  heroTopWide: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  identityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16
  },
  identityRowCompact: {
    alignItems: "flex-start",
    flexDirection: "column"
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    height: 68,
    justifyContent: "center",
    width: 68
  },
  avatarText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 36,
    lineHeight: 38
  },
  avatarTextCompact: {
    fontSize: 30,
    lineHeight: 32
  },
  identityCopy: {
    flexShrink: 1
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display
  },
  email: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    marginTop: 4
  },
  role: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    marginTop: 12
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  heroActionsCompact: {
    flexDirection: "column",
    width: "100%"
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16
  },
  actionButtonFullWidth: {
    width: "100%"
  },
  actionButtonDanger: {
    borderColor: "rgba(255,139,156,0.35)"
  },
  actionButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  actionButtonTextDanger: {
    color: theme.colors.danger
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 22
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    minHeight: 96,
    minWidth: 160,
    padding: 16
  },
  summaryCardCompact: {
    flexBasis: "47%",
    flexGrow: 1
  },
  summaryValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 34,
    lineHeight: 38
  },
  summaryValueCompact: {
    fontSize: 28,
    lineHeight: 32
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  mainGrid: {
    gap: theme.spacing.lg
  },
  mainGridWide: {
    alignItems: "flex-start",
    flexDirection: "row"
  },
  primaryColumn: {
    flex: 1
  },
  secondaryColumn: {
    gap: theme.spacing.md
  },
  secondaryColumnWide: {
    width: 340
  },
  addressSummaryCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg
  },
  addressSummaryTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    marginBottom: 8
  },
  addressSummaryCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  },
  addressPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  addressHint: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    minHeight: 52
  },
  buttonDisabled: {
    opacity: 0.7
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  activityTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6
  },
  activitySubtitle: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    marginBottom: 6
  },
  activityMeta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    marginBottom: 8
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  }
});
