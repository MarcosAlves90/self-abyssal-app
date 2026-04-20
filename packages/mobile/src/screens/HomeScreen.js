import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BranchCard } from "../components/BranchCard";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { SectionHeader } from "../components/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { fetchBranches, fetchMenu, fetchReservations, getApiErrorMessage } from "../services/api";
import { formatCurrency, theme } from "../theme/tokens";

export function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    async function loadHome() {
      try {
        const [nextBranches, nextFeaturedItems, nextReservations] = await Promise.all([
          fetchBranches(),
          fetchMenu({ featured: true }),
          fetchReservations()
        ]);

        setBranches(nextBranches);
        setFeaturedItems(nextFeaturedItems.slice(0, 4));
        setReservations(nextReservations.slice(0, 2));
      } catch (error) {
        Alert.alert("Falha ao carregar a home", getApiErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    }

    loadHome();
  }, []);

  if (isLoading) {
    return <LoadingOverlay label="Mapeando rotas de profundidade..." />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient colors={["#08172c", "#0b203d", "#102646"]} style={styles.hero}>
        <Text style={styles.heroEyebrow}>Bem-vindo de volta</Text>
        <Text style={styles.heroTitle}>{user?.name?.split(" ")[0] || "Explorador"}</Text>
        <Text style={styles.heroSubtitle}>
          Salao escuro, menu vivo e jornadas presenciais ou delivery desenhadas para uma experiencia premium.
        </Text>
        <View style={styles.heroMetrics}>
          <MetricCard label="Filiais" value={String(branches.length)} />
          <MetricCard label="Destaques" value={String(featuredItems.length)} />
          <MetricCard label="Reservas" value={String(reservations.length)} />
        </View>
      </LinearGradient>

      <SectionHeader
        eyebrow="Sprint 1"
        title="Destaques do oceano"
        actionLabel="Ver menu"
        onActionPress={() => navigation.navigate("Menu")}
      />
      {featuredItems.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => navigation.navigate("DishDetails", { item })}
          style={styles.featuredCard}
        >
          <Text style={styles.featuredName}>{item.name}</Text>
          <Text style={styles.featuredCopy}>{item.description}</Text>
          <Text style={styles.featuredPrice}>{formatCurrency(item.priceCents)}</Text>
        </Pressable>
      ))}

      <SectionHeader eyebrow="Presencial" title="Filiais e profundidades" />
      {branches.map((branch) => (
        <BranchCard branch={branch} key={branch.id} />
      ))}

      <SectionHeader eyebrow="Agenda" title="Proximas reservas" />
      {reservations.length ? (
        reservations.map((reservation) => (
          <View key={reservation.id} style={styles.reservationCard}>
            <Text style={styles.reservationBranch}>{reservation.branchName}</Text>
            <Text style={styles.reservationMeta}>
              {new Date(reservation.scheduledAt).toLocaleString("pt-BR")}
            </Text>
            <Text style={styles.reservationMeta}>
              {reservation.depthLevel} • {reservation.guests} pessoas
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyCopy}>
          Nenhuma reserva registrada ainda. Use a aba Reserva para agendar sua mesa.
        </Text>
      )}
    </ScrollView>
  );
}

function MetricCard({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl
  },
  heroEyebrow: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  heroTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 52
  },
  heroSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 8
  },
  heroMetrics: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22
  },
  metricCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: theme.radius.md,
    flex: 1,
    minHeight: 92,
    justifyContent: "center",
    padding: 14
  },
  metricValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 34
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  featuredCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg
  },
  featuredName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    marginBottom: 8
  },
  featuredCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  },
  featuredPrice: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    marginTop: 14
  },
  reservationCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg
  },
  reservationBranch: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 17,
    marginBottom: 6
  },
  reservationMeta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14
  }
});
