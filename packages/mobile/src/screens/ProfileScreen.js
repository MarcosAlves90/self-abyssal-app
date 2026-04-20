import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { SectionHeader } from "../components/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { fetchOrders, fetchReservations, getApiErrorMessage } from "../services/api";
import { formatCurrency, theme } from "../theme/tokens";

export function ProfileScreen() {
  const { logout, refreshUser, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      await refreshUser();
      const [nextOrders, nextReservations] = await Promise.all([
        fetchOrders(),
        fetchReservations()
      ]);
      setOrders(nextOrders);
      setReservations(nextReservations);
    } catch (error) {
      Alert.alert("Falha ao carregar perfil", getApiErrorMessage(error));
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
    </ScrollView>
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
