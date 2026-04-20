import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

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

  const primaryAddress = user?.savedAddresses?.[0];

  return (
    <KeyboardScrollScreen style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role === "admin" ? "Administrador" : "Cliente"}</Text>
      </View>

      <SectionHeader
        eyebrow="Conta"
        title="Resumo"
        actionLabel="Atualizar"
        onActionPress={loadProfile}
      />
      <View style={styles.statsRow}>
        <SummaryCard label="Reservas" value={String(reservations.length)} />
        <SummaryCard label="Pedidos" value={String(orders.length)} />
      </View>

      <SectionHeader eyebrow="Configuracoes" title="Endereco principal" />
      <Text style={styles.sectionCopy}>
        O cadastro inicial nao pede endereco. Salve aqui quando quiser ou antes do
        primeiro delivery.
      </Text>
      {primaryAddress ? (
        <View style={styles.addressCard}>
          <Text style={styles.addressCardTitle}>{primaryAddress.label || "Principal"}</Text>
          <Text style={styles.addressCardCopy}>{primaryAddress.summary}</Text>
        </View>
      ) : (
        <Text style={styles.emptyCopy}>Nenhum endereco salvo ainda.</Text>
      )}
      <View style={styles.addressPanel}>
        <AddressFields
          address={addressForm}
          isLookingUpPostalCode={isLookingUpPostalCode}
          onChangeField={updateAddressField}
          onLookupPostalCode={handlePostalCodeLookup}
        />
        <Text style={styles.addressHint}>
          O CEP preenche rua, bairro, cidade e UF automaticamente. Numero e complemento
          continuam sob seu controle.
        </Text>
        <Pressable
          disabled={isSavingAddress}
          onPress={handleSavePrimaryAddress}
          style={[styles.primaryButton, isSavingAddress && styles.buttonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {isSavingAddress ? "Salvando..." : "Salvar endereco principal"}
          </Text>
        </Pressable>
      </View>

      <SectionHeader eyebrow="Historico" title="Pedidos recentes" />
      {orders.length ? (
        orders.map((order) => (
          <View key={order.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>
              {order.fulfillmentType === "delivery" ? "Delivery" : "Salao"} • {order.status}
            </Text>
            <Text style={styles.itemCopy}>{formatCurrency(order.totalCents)}</Text>
            <Text style={styles.itemMeta}>
              {new Date(order.createdAt).toLocaleString("pt-BR")}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyCopy}>Nenhum pedido registrado ainda.</Text>
      )}

      <SectionHeader eyebrow="Agenda" title="Reservas" />
      {reservations.length ? (
        reservations.map((reservation) => (
          <View key={reservation.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{reservation.branchName}</Text>
            <Text style={styles.itemCopy}>{reservation.depthLevel}</Text>
            <Text style={styles.itemMeta}>
              {new Date(reservation.scheduledAt).toLocaleString("pt-BR")}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyCopy}>Nenhuma reserva confirmada.</Text>
      )}

      <Pressable onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Encerrar sessao</Text>
      </Pressable>
    </KeyboardScrollScreen>
  );
}

function SummaryCard({ label, value }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 120
  },
  hero: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 44
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
    marginTop: 16
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: theme.spacing.xl
  },
  summaryCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    flex: 1,
    minHeight: 104,
    justifyContent: "center",
    padding: theme.spacing.lg
  },
  summaryValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 36
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  sectionCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: theme.spacing.md
  },
  addressCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg
  },
  addressCardTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    marginBottom: 8
  },
  addressCardCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  },
  addressPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg
  },
  addressHint: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
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
  itemCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: 12,
    padding: theme.spacing.lg
  },
  itemTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    marginBottom: 6
  },
  itemCopy: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    marginBottom: 6
  },
  itemMeta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    marginBottom: theme.spacing.lg
  },
  logoutButton: {
    alignItems: "center",
    borderColor: theme.colors.danger,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: theme.spacing.xl,
    minHeight: 52
  },
  logoutButtonText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  }
});
